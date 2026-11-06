/****************************************************************************
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You
 shall not use Cocos Creator software for developing other software or tools
 that's used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to
 you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
#include "Game.h"
#include "base/Log.h"
#include "platform/FileUtils.h"
#include "SteamBridge.h"
#if CC_PLATFORM == CC_PLATFORM_WINDOWS
#include <windows.h>
#include <algorithm>
#include <string>
#include "platform/BasePlatform.h"
#include "platform/interfaces/modules/ISystemWindow.h"
#include "platform/interfaces/modules/ISystemWindowManager.h"
namespace {
bool registerBundledFonts() {
  // FR_PRIVATE keeps the font available only to this game. Never rely on the
  // reviewer's optional Windows language packs or install fonts on their system.
  wchar_t executable[32768]{};
  const DWORD length = GetModuleFileNameW(nullptr, executable, 32768);
  if (!length || length >= 32768) return false;
  const std::wstring path(executable, length);
  const auto directory = path.substr(0, path.find_last_of(L"\\/")) + L"\\Fonts\\";
  const wchar_t* files[] = {
    L"DicekinSans.ttf", L"DicekinSansSC.ttf", L"DicekinSansTC.ttf",
    L"DicekinSansJP.ttf", L"DicekinSansKR.ttf", L"DicekinSansThai.ttf",
    L"DicekinSansDevanagari.ttf", L"DicekinSansBengali.ttf",
    L"DicekinSansTelugu.ttf", L"DicekinSansTamil.ttf", L"DicekinSansArabic.ttf"
  };
  for (const auto* file : files) {
    if (!AddFontResourceExW((directory + file).c_str(), FR_PRIVATE, nullptr)) {
      CC_LOG_ERROR("Unable to register bundled font: %ls", file);
      return false;
    }
  }
  CC_LOG_INFO("Registered all 11 bundled Dicekin font families (process private).");
  return true;
}
HWND dicekinWindow = nullptr;
WNDPROC originalWindowProc = nullptr;
LRESULT CALLBACK fixedAspectWindowProc(HWND window, UINT message, WPARAM edge, LPARAM data) {
  if (message == WM_SIZING || message == WM_GETMINMAXINFO) {
    RECT outer{}, client{}; GetWindowRect(window, &outer); GetClientRect(window, &client);
    const LONG borderW = outer.right - outer.left - client.right;
    const LONG borderH = outer.bottom - outer.top - client.bottom;
    if (message == WM_GETMINMAXINFO) {
      const auto result = CallWindowProc(originalWindowProc, window, message, edge, data);
      auto* limits = reinterpret_cast<MINMAXINFO*>(data);
      limits->ptMinTrackSize.x = 960 + borderW; limits->ptMinTrackSize.y = 540 + borderH;
      return result;
    }
    auto* rect = reinterpret_cast<RECT*>(data);
    if (edge == WMSZ_TOP || edge == WMSZ_BOTTOM) {
      const LONG height = (std::max)(540L, rect->bottom - rect->top - borderH);
      rect->right = rect->left + (height * 16 + 4) / 9 + borderW;
    } else {
      const LONG width = (std::max)(960L, rect->right - rect->left - borderW);
      const LONG height = (width * 9 + 8) / 16 + borderH;
      if (edge == WMSZ_TOPLEFT || edge == WMSZ_TOPRIGHT) rect->top = rect->bottom - height;
      else rect->bottom = rect->top + height;
    }
    return TRUE;
  }
  return CallWindowProc(originalWindowProc, window, message, edge, data);
}
void installAspectLock() {
  const auto* manager = CC_GET_PLATFORM_INTERFACE(cc::ISystemWindowManager);
  if (!manager || manager->getWindows().empty()) return;
  dicekinWindow = reinterpret_cast<HWND>(manager->getWindows().begin()->second->getWindowHandle());
  if (dicekinWindow) originalWindowProc = reinterpret_cast<WNDPROC>(SetWindowLongPtr(dicekinWindow, GWLP_WNDPROC, reinterpret_cast<LONG_PTR>(fixedAspectWindowProc)));
}
}
#endif

#ifndef GAME_NAME
#define GAME_NAME "CocosGame";
#endif

#ifndef SCRIPT_XXTEAKEY
#define SCRIPT_XXTEAKEY "";
#endif

Game::Game() = default;

int Game::init() {
  _windowInfo.title = "Dicekin: Monster Tamer";
  // configurate window size
  _windowInfo.height = 720;
  _windowInfo.width = 1280;

#if CC_DEBUG
  _debuggerInfo.enabled = true;
#else
  _debuggerInfo.enabled = false;
#endif
  _debuggerInfo.port = 6086;
  _debuggerInfo.address = "0.0.0.0";
  _debuggerInfo.pauseOnStart = false;

  _xxteaKey = SCRIPT_XXTEAKEY;

#if CC_PLATFORM == CC_PLATFORM_WINDOWS
  if (!registerBundledFonts()) return -1;
#endif
  dicekin::initializeSteam();
  dicekin::registerSteamBinding();
  BaseGame::init();
#if CC_PLATFORM == CC_PLATFORM_WINDOWS
  installAspectLock();
#endif
  cc::Log::setLogFile(cc::FileUtils::getInstance()->getWritablePath() + "runtime.log");
  return 0;
}

void Game::onPause() { BaseGame::onPause(); }

void Game::onResume() { BaseGame::onResume(); }

void Game::onClose() {
#if CC_PLATFORM == CC_PLATFORM_WINDOWS
  if (dicekinWindow && originalWindowProc && IsWindow(dicekinWindow)) SetWindowLongPtr(dicekinWindow, GWLP_WNDPROC, reinterpret_cast<LONG_PTR>(originalWindowProc));
  dicekinWindow = nullptr; originalWindowProc = nullptr;
#endif
  dicekin::shutdownSteam(); BaseGame::onClose();
}

CC_REGISTER_APPLICATION(Game);
