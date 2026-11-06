#pragma once
#include <string>
namespace dicekin {
void initializeSteam();
void shutdownSteam();
void registerSteamBinding();
std::string steamRequest(const std::string &op, const std::string &args);
std::string steamPoll();
}
