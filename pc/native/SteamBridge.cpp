#include "SteamBridge.h"
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <deque>
#include <functional>
#include <memory>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

#ifndef DICEKIN_STEAM_ENABLED
#define DICEKIN_STEAM_ENABLED 0
#endif
#if DICEKIN_STEAM_ENABLED
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#include "steam/steam_api.h"
#include "steam/isteamnetworkingmessages.h"
#include "steam/isteamnetworkingutils.h"
#endif
#ifndef DICEKIN_STEAM_TEST
#include "bindings/jswrapper/SeApi.h"
#endif

namespace dicekin {
namespace {
using Json = rapidjson::Document;
using Value = rapidjson::Value;
using Alloc = Json::AllocatorType;
constexpr uint32_t APP_ID = 5500200;
constexpr size_t MAX_PACKET = 65536;
constexpr size_t MAX_FILE = 1024 * 1024;
std::string failure = "steam_sdk_not_built";
Json object() { Json value; value.SetObject(); return value; }
Value str(const std::string &value, Alloc &a) { return Value(value.data(), static_cast<rapidjson::SizeType>(value.size()), a); }
std::string encode(const Value &value) { rapidjson::StringBuffer b; rapidjson::Writer<rapidjson::StringBuffer> w(b); value.Accept(w); return {b.GetString(), b.GetSize()}; }
std::string stringAt(const Value &value, const char *key, const std::string &fallback = "") { return value.IsObject() && value.HasMember(key) && value[key].IsString() ? std::string(value[key].GetString(), value[key].GetStringLength()) : fallback; }
int intAt(const Value &value, const char *key, int fallback = 0) { return value.IsObject() && value.HasMember(key) && value[key].IsInt() ? value[key].GetInt() : fallback; }
void put(Value &value, const char *key, const std::string &text, Alloc &a) { value.AddMember(Value(key, a), str(text, a), a); }
Json ok() { auto d = object(); d.AddMember("ok", true, d.GetAllocator()); return d; }
Json error(const std::string &reason) { auto d = object(); d.AddMember("ok", false, d.GetAllocator()); put(d, "error", reason, d.GetAllocator()); return d; }
Json withData(Json data) { auto d = ok(); d.AddMember("data", Value(data, d.GetAllocator()), d.GetAllocator()); return d; }
bool validFile(const std::string &name) { return !name.empty() && name.size() <= 128 && name.front() != '/' && name.find("..") == std::string::npos && std::all_of(name.begin(), name.end(), [](unsigned char c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '/' || c == '_' || c == '-' || c == '.'; }); }
bool validReplayFile(const std::string &name, const std::string &owner) {
  const auto prefix = "raid-" + owner + "-";
  return validFile(name) && name.find('/') == std::string::npos && name.size() > prefix.size() + 5 &&
    name.compare(0, prefix.size(), prefix) == 0 && name.compare(name.size() - 5, 5, ".json") == 0;
}
bool validOwnedCloudFile(const std::string &name, const std::string &owner) {
  return name == "save-" + owner + ".json" || validReplayFile(name, owner);
}
bool quotaAllows(uint64_t size, uint64_t previous, uint64_t available) { return size <= previous || size - previous <= available; }
bool jsonDepthAllowed(const char *data, size_t size) {
  unsigned depth = 0; bool quoted = false, escaped = false;
  for (size_t i = 0; i < size; ++i) {
    const char c = data[i];
    if (quoted) { if (escaped) escaped = false; else if (c == '\\') escaped = true; else if (c == '"') quoted = false; }
    else if (c == '"') quoted = true;
    else if (c == '[' || c == '{') { if (++depth > 64) return false; }
    else if (c == ']' || c == '}') { if (depth == 0) return false; --depth; }
  }
  return depth == 0 && !quoted;
}

#if DICEKIN_STEAM_ENABLED
using Clock = std::chrono::steady_clock;
uint64_t idAt(const Value &args, const char *key) {
  const auto value = stringAt(args, key);
  if (value.empty() || value.size() > 20 || value.find_first_not_of("0123456789") != std::string::npos) return 0;
  try { return std::stoull(value); } catch (...) { return 0; }
}
std::string idString(CSteamID id) { return std::to_string(id.ConvertToUint64()); }
struct Pending {
  SteamAPICall_t handle;
  int requestId;
  std::string op;
  Clock::time_point started;
  std::function<void(bool)> finish;
  bool timedOut = false;
};

class SteamBridge {
public:
  SteamBridge()
    : overlayCallback(this, &SteamBridge::onOverlay), inviteCallback(this, &SteamBridge::onInvite),
      lobbyChatCallback(this, &SteamBridge::onLobbyChat), lobbyDataCallback(this, &SteamBridge::onLobbyData),
      sessionCallback(this, &SteamBridge::onSession), sessionFailedCallback(this, &SteamBridge::onSessionFailed),
      disconnectedCallback(this, &SteamBridge::onDisconnected), connectedCallback(this, &SteamBridge::onConnected),
      statsStoredCallback(this, &SteamBridge::onStatsStored) {
    SteamNetworkingUtils()->InitRelayNetworkAccess();
  }
  ~SteamBridge() { leave(); }
  CSteamID lobby;
  int nextId = 1;
  int lobbyRequest = 0;
  std::deque<std::string> events;
  std::vector<Pending> pending;
  std::vector<CSteamID> peers;
  std::unordered_map<UGCHandle_t, uint64_t> scoreFiles;
  CCallback<SteamBridge, GameOverlayActivated_t> overlayCallback;
  CCallback<SteamBridge, GameLobbyJoinRequested_t> inviteCallback;
  CCallback<SteamBridge, LobbyChatUpdate_t> lobbyChatCallback;
  CCallback<SteamBridge, LobbyDataUpdate_t> lobbyDataCallback;
  CCallback<SteamBridge, SteamNetworkingMessagesSessionRequest_t> sessionCallback;
  CCallback<SteamBridge, SteamNetworkingMessagesSessionFailed_t> sessionFailedCallback;
  CCallback<SteamBridge, SteamServersDisconnected_t> disconnectedCallback;
  CCallback<SteamBridge, SteamServersConnected_t> connectedCallback;
  CCallback<SteamBridge, UserStatsStored_t> statsStoredCallback;
  uint64_t statsRevision = 0, storedRevision = 0;
  bool statsDirty = false, statsPending = false;
  Clock::time_point statsAttempt = Clock::time_point::min();
  void onStatsStored(UserStatsStored_t *event) {
    if (event->m_nGameID != APP_ID || !statsPending) return;
    statsPending = false;
    if (event->m_eResult == k_EResultOK && storedRevision == statsRevision) statsDirty = false;
    auto d = object(); d.AddMember("ok", event->m_eResult == k_EResultOK, d.GetAllocator()); emit(std::move(d), "achievements.stored");
  }

  void emit(Json d, const char *type) {
    d.AddMember("type", Value(type, d.GetAllocator()), d.GetAllocator());
    // Bounded queue and bounded receive work keep a noisy peer from stalling solo gameplay.
    if (events.size() >= 1024) events.pop_front();
    events.push_back(encode(d));
  }
  void result(int id, const std::string &op, Json response) {
    response.AddMember("requestId", id, response.GetAllocator());
    put(response, "op", op, response.GetAllocator()); emit(std::move(response), "result");
  }
  template<class T> void wait(SteamAPICall_t call, int id, const std::string &op, std::function<void(T &, bool)> callback) {
    if (call == k_uAPICallInvalid) { if (lobbyRequest == id) lobbyRequest = 0; result(id, op, error("steam_call_failed")); return; }
    pending.push_back({call, id, op, Clock::now(), [call, callback](bool failed) {
      T data{}; bool ioFailure = false;
      const bool valid = !failed && SteamUtils()->GetAPICallResult(call, &data, sizeof(T), T::k_iCallback, &ioFailure);
      callback(data, !valid || ioFailure);
    }});
  }
  Json accepted(int id) { auto d = ok(); d.AddMember("requestId", id, d.GetAllocator()); return d; }
  bool member(CSteamID peer) const {
    if (!lobby.IsValid() || !peer.IsValid()) return false;
    const int count = SteamMatchmaking()->GetNumLobbyMembers(lobby);
    for (int i = 0; i < count; ++i) if (SteamMatchmaking()->GetLobbyMemberByIndex(lobby, i) == peer) return true;
    return false;
  }
  void closePeer(CSteamID peer) { SteamNetworkingIdentity id; id.SetSteamID(peer); SteamNetworkingMessages()->CloseSessionWithUser(id); }
  void leave() {
    for (const auto peer : peers) closePeer(peer);
    peers.clear();
    if (lobby.IsValid()) SteamMatchmaking()->LeaveLobby(lobby);
    lobby.Clear(); SteamFriends()->ClearRichPresence();
  }
  Json identity() {
    auto d = object(); auto &a = d.GetAllocator();
    d.AddMember("available", true, a); d.AddMember("online", SteamUser()->BLoggedOn(), a);
    d.AddMember("appId", APP_ID, a); d.AddMember("overlayEnabled", SteamUtils()->IsOverlayEnabled(), a);
    put(d, "steamId", idString(SteamUser()->GetSteamID()), a); put(d, "name", SteamFriends()->GetPersonaName(), a);
    return d;
  }
  Json lobbyInfo() {
    auto d = object(); auto &a = d.GetAllocator();
    put(d, "lobbyId", lobby.IsValid() ? idString(lobby) : "", a);
    put(d, "ownerId", lobby.IsValid() ? idString(SteamMatchmaking()->GetLobbyOwner(lobby)) : "", a);
    Value members(rapidjson::kArrayType), metadata(rapidjson::kObjectType);
    if (lobby.IsValid()) {
      const int count = SteamMatchmaking()->GetNumLobbyMembers(lobby);
      for (int i = 0; i < count; ++i) {
        const CSteamID peer = SteamMatchmaking()->GetLobbyMemberByIndex(lobby, i);
        Value row(rapidjson::kObjectType); put(row, "steamId", idString(peer), a);
        put(row, "name", SteamFriends()->GetFriendPersonaName(peer), a); members.PushBack(row, a);
      }
      const int countData = std::min(32, SteamMatchmaking()->GetLobbyDataCount(lobby));
      for (int i = 0; i < countData; ++i) {
        char key[256]{}, value[4096]{};
        if (SteamMatchmaking()->GetLobbyDataByIndex(lobby, i, key, sizeof(key), value, sizeof(value))) put(metadata, key, value, a);
      }
    }
    d.AddMember("members", members, a); d.AddMember("metadata", metadata, a); return d;
  }
  void lobbyChanged() {
    for (auto it = peers.begin(); it != peers.end();) {
      if (!member(*it)) { closePeer(*it); it = peers.erase(it); } else ++it;
    }
    emit(lobbyInfo(), "lobby");
  }
  void onOverlay(GameOverlayActivated_t *e) { auto d = object(); d.AddMember("active", e->m_bActive != 0, d.GetAllocator()); emit(std::move(d), "overlay"); }
  void onInvite(GameLobbyJoinRequested_t *e) { auto d = object(); put(d, "lobbyId", idString(e->m_steamIDLobby), d.GetAllocator()); put(d, "friendId", idString(e->m_steamIDFriend), d.GetAllocator()); emit(std::move(d), "lobbyInvite"); }
  void onLobbyChat(LobbyChatUpdate_t *e) {
    if (e->m_ulSteamIDLobby != lobby.ConvertToUint64()) return;
    if (e->m_ulSteamIDUserChanged == SteamUser()->GetSteamID().ConvertToUint64() &&
        (e->m_rgfChatMemberStateChange & (k_EChatMemberStateChangeLeft | k_EChatMemberStateChangeDisconnected | k_EChatMemberStateChangeKicked | k_EChatMemberStateChangeBanned))) leave();
    lobbyChanged();
  }
  void onLobbyData(LobbyDataUpdate_t *e) { if (e->m_ulSteamIDLobby == lobby.ConvertToUint64()) lobbyChanged(); }
  void onSession(SteamNetworkingMessagesSessionRequest_t *e) {
    const auto peer = e->m_identityRemote.GetSteamID();
    if (member(peer)) { SteamNetworkingMessages()->AcceptSessionWithUser(e->m_identityRemote); if (std::find(peers.begin(), peers.end(), peer) == peers.end()) peers.push_back(peer); }
    else SteamNetworkingMessages()->CloseSessionWithUser(e->m_identityRemote);
  }
  void onSessionFailed(SteamNetworkingMessagesSessionFailed_t *e) {
    auto d = object(); put(d, "steamId", idString(e->m_info.m_identityRemote.GetSteamID()), d.GetAllocator());
    put(d, "error", e->m_info.m_szEndDebug, d.GetAllocator()); emit(std::move(d), "connection");
  }
  void onDisconnected(SteamServersDisconnected_t *) { emit(identity(), "status"); }
  void onConnected(SteamServersConnected_t *) { emit(identity(), "status"); }

  void pump() {
    SteamAPI_RunCallbacks();
    // Move ready calls out first: completing find/create can enqueue an upload/download.
    std::vector<Pending> ready;
    for (auto it = pending.begin(); it != pending.end();) {
      bool failed = false;
      if (!it->timedOut && Clock::now() - it->started > std::chrono::seconds(30)) {
        if (it->requestId == lobbyRequest) lobbyRequest = 0;
        result(it->requestId, it->op, error("steam_timeout"));
        // Steam cannot cancel create/join. Retain only its cleanup callback so a late
        // success cannot strand us in an untracked lobby or replace a newer room.
        if (it->op == "lobby.create" || it->op == "lobby.join") { it->timedOut = true; ++it; }
        else it = pending.erase(it);
      } else if (SteamUtils()->IsAPICallCompleted(it->handle, &failed)) {
        auto call = std::move(*it); it = pending.erase(it);
        const auto finish = call.finish; call.finish = [finish, failed](bool) { finish(failed); }; ready.push_back(std::move(call));
      } else ++it;
    }
    for (auto &call : ready) call.finish(false);
    SteamNetworkingMessage_t *messages[32]{};
    const int count = SteamNetworkingMessages()->ReceiveMessagesOnChannel(0, messages, 32);
    for (int i = 0; i < count; ++i) {
      auto *m = messages[i]; const auto peer = m->m_identityPeer.GetSteamID();
      if (member(peer) && m->m_cbSize > 0 && m->m_cbSize <= static_cast<int>(MAX_PACKET) && jsonDepthAllowed(static_cast<const char *>(m->m_pData), m->m_cbSize)) {
        Json packet; packet.Parse(static_cast<const char *>(m->m_pData), m->m_cbSize);
        if (!packet.HasParseError() && packet.IsObject() && idAt(packet, "lobbyId") == lobby.ConvertToUint64() && packet.HasMember("payload")) {
          auto d = object(); auto &a = d.GetAllocator(); put(d, "steamId", idString(peer), a);
          d.AddMember("payload", Value(packet["payload"], a), a); emit(std::move(d), "message");
        }
      } else if (!member(peer)) closePeer(peer);
      m->Release();
    }
  }

  Json friends() {
    auto d = object(); auto &a = d.GetAllocator(); Value rows(rapidjson::kArrayType);
    const int count = SteamFriends()->GetFriendCount(k_EFriendFlagImmediate);
    for (int i = 0; i < count; ++i) {
      const auto id = SteamFriends()->GetFriendByIndex(i, k_EFriendFlagImmediate);
      Value row(rapidjson::kObjectType); put(row, "steamId", idString(id), a); put(row, "name", SteamFriends()->GetFriendPersonaName(id), a);
      row.AddMember("state", static_cast<int>(SteamFriends()->GetFriendPersonaState(id)), a);
      FriendGameInfo_t game{}; const bool playing = SteamFriends()->GetFriendGamePlayed(id, &game);
      row.AddMember("inGame", playing && game.m_gameID.AppID() == APP_ID, a);
      put(row, "gameId", playing ? std::to_string(game.m_gameID.AppID()) : "", a);
      put(row, "lobbyId", playing && game.m_steamIDLobby.IsValid() ? idString(game.m_steamIDLobby) : "", a); rows.PushBack(row, a);
    }
    d.AddMember("friends", rows, a); return withData(std::move(d));
  }

  void boardAction(SteamLeaderboard_t board, int id, const std::string &op, const std::shared_ptr<Json> &args) {
    if (op == "leaderboard.upload") {
      std::vector<int32> details;
      if (args->HasMember("details")) for (const auto &value : (*args)["details"].GetArray()) details.push_back(value.GetInt());
      wait<LeaderboardScoreUploaded_t>(SteamUserStats()->UploadLeaderboardScore(board, k_ELeaderboardUploadScoreMethodKeepBest, (*args)["score"].GetInt(), details.data(), static_cast<int>(details.size())), id, op,
        [this, id, op, board, args](LeaderboardScoreUploaded_t &value, bool failed) {
          if (failed || !value.m_bSuccess) { result(id, op, error("leaderboard_upload_failed")); return; }
          auto d = object(); d.AddMember("score", value.m_nScore, d.GetAllocator()); d.AddMember("rank", value.m_nGlobalRankNew, d.GetAllocator()); d.AddMember("changed", value.m_bScoreChanged != 0, d.GetAllocator());
          const auto ugc = idAt(*args, "ugcHandle");
          // Never attach a worse run's roster to the retained best score.
          if (ugc && value.m_bScoreChanged) {
            auto retained = std::make_shared<Json>(std::move(d));
            wait<LeaderboardUGCSet_t>(SteamUserStats()->AttachLeaderboardUGC(board, ugc), id, op, [this, id, op, retained](LeaderboardUGCSet_t &attached, bool io) {
              if (io || attached.m_eResult != k_EResultOK) { result(id, op, error("leaderboard_detail_attach_failed")); return; }
              result(id, op, withData(std::move(*retained)));
            });
          } else result(id, op, withData(std::move(d)));
        });
    } else {
      const auto scope = stringAt(*args, "scope", "global");
      const int start = std::min(1000000, std::max(1, intAt(*args, "start", 1))), end = std::min(start + 99, std::max(start, intAt(*args, "end", 50)));
      wait<LeaderboardScoresDownloaded_t>(SteamUserStats()->DownloadLeaderboardEntries(board, scope == "friends" ? k_ELeaderboardDataRequestFriends : k_ELeaderboardDataRequestGlobal, start, end), id, op,
        [this, id, op](LeaderboardScoresDownloaded_t &value, bool failed) {
          if (failed) { result(id, op, error("leaderboard_query_failed")); return; }
          auto d = object(); auto &a = d.GetAllocator(); Value rows(rapidjson::kArrayType);
          for (int i = 0; i < value.m_cEntryCount; ++i) {
            LeaderboardEntry_t entry{}; int32 details[64]{};
            if (!SteamUserStats()->GetDownloadedLeaderboardEntry(value.m_hSteamLeaderboardEntries, i, &entry, details, 64)) continue;
            // Steam frees this result handle only after every row has been read.
            if (i >= 100) continue;
            Value row(rapidjson::kObjectType), extra(rapidjson::kArrayType);
            put(row, "steamId", idString(entry.m_steamIDUser), a); put(row, "name", SteamFriends()->GetFriendPersonaName(entry.m_steamIDUser), a);
            row.AddMember("rank", entry.m_nGlobalRank, a); row.AddMember("score", entry.m_nScore, a);
            for (int j = 0; j < std::min(64, entry.m_cDetails); ++j) extra.PushBack(details[j], a);
            if (entry.m_hUGC && entry.m_hUGC != k_UGCHandleInvalid) {
              if (scoreFiles.size() >= 2048) scoreFiles.clear();
              scoreFiles[entry.m_hUGC] = entry.m_steamIDUser.ConvertToUint64();
            }
            row.AddMember("details", extra, a); put(row, "ugcHandle", entry.m_hUGC == k_UGCHandleInvalid ? "" : std::to_string(entry.m_hUGC), a); rows.PushBack(row, a);
          }
          d.AddMember("entries", rows, a); result(id, op, withData(std::move(d)));
        });
    }
  }

  Json request(const std::string &op, const std::shared_ptr<Json> &args) {
    if (op == "status") return withData(identity());
    if (op == "lobby.get") return withData(lobbyInfo());
    if (op == "lobby.leave") {
      if (lobbyRequest) for (auto &call : pending) if (call.requestId == lobbyRequest && !call.timedOut) {
        result(call.requestId, call.op, error("lobby_cancelled")); call.timedOut = true;
      }
      lobbyRequest = 0; leave(); lobbyChanged(); return ok();
    }
    if (!SteamUser()->BLoggedOn()) return error("steam_offline");
    if (op == "achievements.sync") {
      static const std::vector<std::string> allowed = {"DK_PARTNER","DK_MAP_1","DK_MAP_6","DK_MAP_12","DK_COLLECT_10","DK_COLLECT_30","DK_COLLECT_60","DK_HATCH_1","DK_HATCH_10","DK_SSR","DK_SHINY","DK_GYM_1","DK_GYM_9","DK_COOK","DK_FEAST","DK_RAID"};
      if (!args->HasMember("ids") || !(*args)["ids"].IsArray() || (*args)["ids"].Size() > allowed.size()) return error("invalid_achievements");
      for (const auto &id : (*args)["ids"].GetArray()) if (!id.IsString() || std::find(allowed.begin(), allowed.end(), std::string(id.GetString(), id.GetStringLength())) == allowed.end()) return error("invalid_achievement");
      // SDK 1.65 synchronizes current-user stats before process launch; RequestCurrentStats was removed.
      for (const auto &id : (*args)["ids"].GetArray()) {
        bool achieved = false;
        if (!SteamUserStats()->GetAchievement(id.GetString(), &achieved)) return error("achievement_definition_unavailable");
        if (!achieved) { if (!SteamUserStats()->SetAchievement(id.GetString())) return error("achievement_set_failed"); ++statsRevision; statsDirty = true; }
      }
      const auto now = Clock::now();
      if (statsPending && now - statsAttempt > std::chrono::seconds(60)) statsPending = false;
      if (statsDirty && !statsPending && (statsAttempt == Clock::time_point::min() || now - statsAttempt >= std::chrono::seconds(30))) {
        storedRevision = statsRevision; statsAttempt = now;
        statsPending = SteamUserStats()->StoreStats();
        if (!statsPending) return error("achievement_store_failed");
      }
      auto d = object(); d.AddMember("pending", statsDirty, d.GetAllocator()); return withData(std::move(d));
    }
    if (op == "time") { const auto seconds = SteamUtils()->GetServerRealTime(); if (!seconds) return error("steam_time_unavailable"); auto d = object(); d.AddMember("unixSeconds", seconds, d.GetAllocator()); return withData(std::move(d)); }
    if (op == "friends") return friends();
    if (op == "overlay.store" || op == "overlay.invite") {
      if (!SteamUtils()->IsOverlayEnabled()) return error("steam_overlay_unavailable");
      if (op == "overlay.store") SteamFriends()->ActivateGameOverlayToStore(APP_ID, k_EOverlayToStoreFlag_None);
      else { if (!lobby.IsValid()) return error("lobby_required"); SteamFriends()->ActivateGameOverlayInviteDialog(lobby); }
      return ok();
    }
    if (op == "lobby.setData") {
      const auto key = stringAt(*args, "key"), value = stringAt(*args, "value");
      if (!lobby.IsValid() || SteamMatchmaking()->GetLobbyOwner(lobby) != SteamUser()->GetSteamID()) return error("lobby_owner_required");
      if (key.empty() || key.size() > 128 || value.size() > 2048) return error("invalid_lobby_data");
      return SteamMatchmaking()->SetLobbyData(lobby, key.c_str(), value.c_str()) ? ok() : error("lobby_data_failed");
    }
    if (op == "message.send") {
      const CSteamID peer(idAt(*args, "steamId"));
      if (!member(peer) || peer == SteamUser()->GetSteamID()) return error("lobby_peer_required");
      if (!args->HasMember("payload")) return error("payload_required");
      auto packet = object(); put(packet, "lobbyId", idString(lobby), packet.GetAllocator()); packet.AddMember("payload", Value((*args)["payload"], packet.GetAllocator()), packet.GetAllocator());
      const auto body = encode(packet); if (body.size() > MAX_PACKET) return error("message_too_large");
      SteamNetworkingIdentity identity; identity.SetSteamID(peer);
      const auto sent = SteamNetworkingMessages()->SendMessageToUser(identity, body.data(), static_cast<uint32>(body.size()), k_nSteamNetworkingSend_Reliable | k_nSteamNetworkingSend_AutoRestartBrokenSession, 0);
      if (sent != k_EResultOK) return error("message_send_failed_" + std::to_string(sent));
      if (std::find(peers.begin(), peers.end(), peer) == peers.end()) peers.push_back(peer);
      return ok();
    }
    if (op == "cloud.read" || op == "cloud.write" || op == "cloud.share") {
      if (!SteamRemoteStorage()->IsCloudEnabledForAccount() || !SteamRemoteStorage()->IsCloudEnabledForApp()) return error("steam_cloud_unavailable");
      const auto name = stringAt(*args, "name"); if (!validFile(name)) return error("invalid_cloud_name");
      if (!validOwnedCloudFile(name, idString(SteamUser()->GetSteamID()))) return error("cloud_owner_mismatch");
      if (op == "cloud.write") {
        if (!args->HasMember("content") || !(*args)["content"].IsString()) return error("invalid_cloud_content");
        const auto body = stringAt(*args, "content"); if (body.size() > MAX_FILE) return error("cloud_file_too_large");
        uint64 total = 0, available = 0;
        if (!SteamRemoteStorage()->GetQuota(&total, &available) || !total) return error("cloud_quota_unavailable");
        const int previous = SteamRemoteStorage()->FileExists(name.c_str()) ? std::max(0, SteamRemoteStorage()->GetFileSize(name.c_str())) : 0;
        if (!quotaAllows(body.size(), previous, available)) return error("cloud_quota_exceeded");
        return SteamRemoteStorage()->FileWrite(name.c_str(), body.data(), static_cast<int>(body.size())) ? ok() : error("cloud_write_failed");
      }
      if (op == "cloud.read") {
        if (!SteamRemoteStorage()->FileExists(name.c_str())) return error("cloud_file_missing");
        const int size = SteamRemoteStorage()->GetFileSize(name.c_str()); if (size < 0 || size > static_cast<int>(MAX_FILE)) return error("cloud_file_too_large");
        std::string body(size, '\0'); const int read = SteamRemoteStorage()->FileRead(name.c_str(), body.data(), size);
        if (read != size) return error("cloud_read_failed"); auto d = object(); put(d, "content", body, d.GetAllocator()); return withData(std::move(d));
      }
    }
    if (pending.size() >= 24) return error("steam_busy");
    if (op == "lobby.create" || op == "lobby.join") {
      if (lobbyRequest) return error("lobby_busy");
      const int max = intAt(*args, "maxMembers", 4); const CSteamID target(idAt(*args, "lobbyId"));
      if (op == "lobby.create" && (max < 2 || max > 4)) return error("invalid_lobby_size");
      if (op == "lobby.join" && (!target.IsValid() || !target.IsLobby())) return error("invalid_lobby_id");
      leave(); const int id = nextId++; lobbyRequest = id;
      if (op == "lobby.create") {
        wait<LobbyCreated_t>(SteamMatchmaking()->CreateLobby(k_ELobbyTypePrivate, max), id, op, [this, id, op, args](LobbyCreated_t &value, bool failed) {
          if (lobbyRequest != id) { if (!failed && value.m_eResult == k_EResultOK) SteamMatchmaking()->LeaveLobby(CSteamID(value.m_ulSteamIDLobby)); return; }
          lobbyRequest = 0;
          if (failed || value.m_eResult != k_EResultOK) { result(id, op, error("lobby_create_failed")); return; }
          lobby = CSteamID(value.m_ulSteamIDLobby);
          SteamMatchmaking()->SetLobbyData(lobby, "app", "dicekin");
          if (args->HasMember("metadata") && (*args)["metadata"].IsObject()) for (auto it = (*args)["metadata"].MemberBegin(); it != (*args)["metadata"].MemberEnd(); ++it) {
            if (it->name.GetStringLength() <= 128 && it->value.IsString() && it->value.GetStringLength() <= 2048) SteamMatchmaking()->SetLobbyData(lobby, it->name.GetString(), it->value.GetString());
          }
          SteamFriends()->SetRichPresence("connect", ("+connect_lobby " + idString(lobby)).c_str()); result(id, op, withData(lobbyInfo())); lobbyChanged();
        });
      } else wait<LobbyEnter_t>(SteamMatchmaking()->JoinLobby(target), id, op, [this, id, op](LobbyEnter_t &value, bool failed) {
        if (lobbyRequest != id) { if (!failed && value.m_EChatRoomEnterResponse == k_EChatRoomEnterResponseSuccess) SteamMatchmaking()->LeaveLobby(CSteamID(value.m_ulSteamIDLobby)); return; }
        lobbyRequest = 0;
        if (failed || value.m_EChatRoomEnterResponse != k_EChatRoomEnterResponseSuccess) { result(id, op, error("lobby_join_failed")); return; }
        lobby = CSteamID(value.m_ulSteamIDLobby); const auto app = SteamMatchmaking()->GetLobbyData(lobby, "app");
        if (std::string(app) != "dicekin" || SteamMatchmaking()->GetNumLobbyMembers(lobby) > 4) { leave(); result(id, op, error("incompatible_lobby")); return; }
        SteamFriends()->SetRichPresence("connect", ("+connect_lobby " + idString(lobby)).c_str()); result(id, op, withData(lobbyInfo())); lobbyChanged();
      });
      return accepted(id);
    }
    if (op == "leaderboard.upload" || op == "leaderboard.query") {
      const auto name = stringAt(*args, "name");
      if (name.empty() || name.size() > 128 || name.find_first_not_of("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-") != std::string::npos) return error("invalid_leaderboard_name");
      if (op == "leaderboard.upload") {
        if (std::any_of(pending.begin(), pending.end(), [](const Pending &p) { return p.op == "leaderboard.upload"; })) return error("leaderboard_busy");
        if (!args->HasMember("score") || !(*args)["score"].IsInt()) return error("invalid_score");
        if (args->HasMember("details")) { const auto &details = (*args)["details"]; if (!details.IsArray() || details.Size() > 64) return error("invalid_score_details"); for (const auto &v : details.GetArray()) if (!v.IsInt()) return error("invalid_score_details"); }
      }
      const int id = nextId++;
      wait<LeaderboardFindResult_t>(SteamUserStats()->FindOrCreateLeaderboard(name.c_str(), k_ELeaderboardSortMethodDescending, k_ELeaderboardDisplayTypeNumeric), id, op,
        [this, id, op, args](LeaderboardFindResult_t &value, bool failed) {
          if (failed || !value.m_bLeaderboardFound) result(id, op, error("leaderboard_not_found"));
          else if (SteamUserStats()->GetLeaderboardSortMethod(value.m_hSteamLeaderboard) != k_ELeaderboardSortMethodDescending) result(id, op, error("leaderboard_sort_mismatch"));
          else boardAction(value.m_hSteamLeaderboard, id, op, args);
        });
      return accepted(id);
    }
    if (op == "cloud.share") {
      const auto name = stringAt(*args, "name");
      // Only public raid replays may be shared. A profile/cloud-save filename must never be published by this path.
      if (!validReplayFile(name, idString(SteamUser()->GetSteamID()))) return error("replay_file_required");
      if (!SteamRemoteStorage()->FileExists(name.c_str()) || SteamRemoteStorage()->GetFileSize(name.c_str()) > static_cast<int>(MAX_FILE)) return error("invalid_replay_file");
      const int id = nextId++;
      wait<RemoteStorageFileShareResult_t>(SteamRemoteStorage()->FileShare(name.c_str()), id, op, [this, id, op](RemoteStorageFileShareResult_t &value, bool failed) {
        if (failed || value.m_eResult != k_EResultOK) { result(id, op, error("cloud_share_failed")); return; }
        auto d = object(); put(d, "handle", std::to_string(value.m_hFile), d.GetAllocator()); result(id, op, withData(std::move(d)));
      }); return accepted(id);
    }
    if (op == "ugc.read") {
      const auto handle = idAt(*args, "handle"); if (!handle || handle == k_UGCHandleInvalid) return error("invalid_ugc_handle");
      const auto expected = scoreFiles.find(handle); if (expected == scoreFiles.end()) return error("leaderboard_ugc_required");
      const auto owner = expected->second;
      const int id = nextId++;
      wait<RemoteStorageDownloadUGCResult_t>(SteamRemoteStorage()->UGCDownload(handle, 0), id, op, [this, id, op, owner](RemoteStorageDownloadUGCResult_t &value, bool failed) {
        if (failed || value.m_eResult != k_EResultOK || value.m_nAppID != APP_ID || value.m_ulSteamIDOwner != owner || !validReplayFile(value.m_pchFileName, std::to_string(owner)) || value.m_nSizeInBytes < 0 || value.m_nSizeInBytes > static_cast<int>(MAX_FILE)) {
          if (!failed && value.m_eResult == k_EResultOK) { char unused{}; SteamRemoteStorage()->UGCRead(value.m_hFile, &unused, 0, 0, k_EUGCRead_Close); }
          result(id, op, error("ugc_download_failed")); return;
        }
        std::string body(value.m_nSizeInBytes, '\0'); const int count = SteamRemoteStorage()->UGCRead(value.m_hFile, body.data(), value.m_nSizeInBytes, 0, k_EUGCRead_Close);
        if (count != value.m_nSizeInBytes) { result(id, op, error("ugc_read_failed")); return; }
        auto d = object(); put(d, "content", body, d.GetAllocator()); put(d, "ownerId", std::to_string(value.m_ulSteamIDOwner), d.GetAllocator()); result(id, op, withData(std::move(d)));
      }); return accepted(id);
    }
    return error("unknown_steam_operation");
  }
};
std::unique_ptr<SteamBridge> bridge;
HMODULE steamModule = nullptr;
bool initialized = false;
#endif
} // namespace

void initializeSteam() {
#if DICEKIN_STEAM_ENABLED
  if (initialized) return;
  // Explicit executable-relative load avoids search-path injection and makes DLL absence nonfatal.
  wchar_t executable[32768]{}; const DWORD length = GetModuleFileNameW(nullptr, executable, 32768);
  std::wstring dll(executable, length); const auto slash = dll.find_last_of(L"\\/");
  if (slash == std::wstring::npos) { failure = "steam_library_missing"; return; }
  dll.resize(slash + 1); dll += L"steam_api64.dll";
  steamModule = LoadLibraryExW(dll.c_str(), nullptr, LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_DEFAULT_DIRS);
  if (!steamModule) { failure = "steam_library_missing"; return; }
  if (!SteamAPI_Init()) { failure = "steam_init_failed"; return; }
  if (SteamUtils()->GetAppID() != APP_ID || !SteamUser()->GetSteamID().IsValid()) { SteamAPI_Shutdown(); failure = "steam_app_mismatch"; return; }
  initialized = true; bridge = std::make_unique<SteamBridge>(); failure.clear();
  // An invitation can launch a closed game; queue it for UI confirmation after save-safe startup.
  std::wistringstream command(GetCommandLineW()); std::wstring word;
  while (command >> word) if (word == L"+connect_lobby" && command >> word && word.size() <= 20 && word.find_first_not_of(L"0123456789") == std::wstring::npos) {
    auto d = object(); put(d, "lobbyId", std::string(word.begin(), word.end()), d.GetAllocator()); put(d, "friendId", "", d.GetAllocator()); bridge->emit(std::move(d), "lobbyInvite"); break;
  }
#endif
}

void shutdownSteam() {
#if DICEKIN_STEAM_ENABLED
  bridge.reset();
  if (initialized) { SteamAPI_Shutdown(); initialized = false; }
  // Delay-load caches the module handle; leave it loaded until process exit.
  failure = "steam_closed";
#endif
}

std::string steamRequest(const std::string &op, const std::string &raw) {
  if (raw.size() > MAX_FILE + 4096) return encode(error("steam_arguments_too_large"));
  if (!jsonDepthAllowed(raw.data(), raw.size())) return encode(error("invalid_steam_arguments"));
  auto args = std::make_shared<Json>(); args->Parse(raw.data(), raw.size());
  if (args->HasParseError() || !args->IsObject()) return encode(error("invalid_steam_arguments"));
#if DICEKIN_STEAM_ENABLED
  if (bridge) return encode(bridge->request(op, args));
#endif
  if (op == "status") {
    auto d = object(); auto &a = d.GetAllocator(); d.AddMember("available", false, a); d.AddMember("online", false, a); d.AddMember("appId", APP_ID, a); d.AddMember("overlayEnabled", false, a);
    put(d, "steamId", "", a); put(d, "name", "", a); put(d, "error", failure, a); return encode(withData(std::move(d)));
  }
  return encode(error(failure));
}

std::string steamPoll() {
#if DICEKIN_STEAM_ENABLED
  if (bridge) {
    bridge->pump(); std::string out = "[";
    while (!bridge->events.empty()) { if (out.size() > 1) out += ','; out += bridge->events.front(); bridge->events.pop_front(); }
    return out + ']';
  }
#endif
  return "[]";
}

#ifndef DICEKIN_STEAM_TEST
namespace {
bool jsRequest(se::State &s) {
  const auto &args = s.args();
  if (args.size() != 2 || !args[0].isString() || !args[1].isString()) { s.rval().setString("{\"ok\":false,\"error\":\"invalid_steam_arguments\"}"); return true; }
  s.rval().setString(steamRequest(args[0].toString(), args[1].toString())); return true;
}
SE_BIND_FUNC(jsRequest)
bool jsPoll(se::State &s) { s.rval().setString(steamPoll()); return true; }
SE_BIND_FUNC(jsPoll)
bool bindSteam(se::Object *global) {
  auto *object = se::Object::createPlainObject();
  object->defineFunction("request", _SE(jsRequest)); object->defineFunction("poll", _SE(jsPoll));
  global->setProperty("__dicekinSteam", se::Value(object)); object->decRef(); return true;
}
}
void registerSteamBinding() { se::ScriptEngine::getInstance()->addPermanentRegisterCallback(bindSteam); }
#else
void registerSteamBinding() {}
#endif
} // namespace dicekin
