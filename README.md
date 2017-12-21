# FingerprintingBlocker [![Build Status](https://travis-ci.org/AdguardTeam/FingerprintingBlocker.svg?branch=master)](https://travis-ci.org/AdguardTeam/FingerprintingBlocker)
Fingerprinting blocker extension
## Summary

FingerprintingBlocker is a userscript that prevents fingerprinting attempts.

## Key features:

 * Prevents canvas fingerprinting 

 * Cross-browser support
 * Fully configurable behavior
   - per-site settings

## Installation
 - If you are using a standalone AdGuard app that supports userscripts, you can install it in it.
To use with browser extensions,
 - For Firefox, it is designed to operate with Tampermonkey. We have made it work with Greasemonkey for our another project [PopupBlocker](https://github.com/AdguardTeam/PopupBlocker), but we have dropped its support due to design complexity that would incur for supporting it.
 - Otherwise, it will work with any userscript extension.
 - If you are using Chrome and using FingerprintingBlocker in _Faking mode_, it is recommended to enable a flag [Experimental Validate Asm.js and convert to WebAssembly when valid.](chrome://flags/#enable-asm-webassembly).

## Fingerprinting Proof-of-concept sites

Test your installation with

 - [BrowserLeaks.com](https://browserleaks.com/)
 - [Panopticlick](https://panopticlick.eff.org/)
 - [UniqueMachine](http://uniquemachine.org/)
 - [AmIUnique](https://amiunique.org/)

## Settings page

A temporary settings page is available at: https://AdguardTeam.github.io/FingerprintingBlocker/settings.html

## Development build

Built automatically on every new commit: https://AdguardTeam.github.io/FingerprintingBlocker/fingerprintingblocker.user.js
Unit test for dev build is [here](https://AdguardTeam.github.io/FingerprintingBlocker/test/).

## How to build

Install the package by running:
```
yarn install
```

Build the dev version of userscript without minification by running:
```
gulp dev
```
Build the beta or release version of userscript by running:
```
gulp beta
gulp release
```
Build asm.js components by installing emscripten by following [official guide](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html) and optionally [guide to installing for all users](https://github.com/kripken/emscripten/issues/1842) and running:
```
gulp generate-asm
```
