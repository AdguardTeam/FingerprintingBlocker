# FingerprintingBlocker [![Build Status](https://travis-ci.org/AdguardTeam/FingerprintingBlocker.svg?branch=master)](https://travis-ci.org/AdguardTeam/FingerprintingBlocker)
Fingerprinting blocker extension

# Development build

Built automatically on every new commit: https://AdguardTeam.github.io/FingerprintingBlocker/fingerprintingblocker.user.js
Unit test for dev build is [here](https://AdguardTeam.github.io/FingerprintingBlocker/test/).

# How to build

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
