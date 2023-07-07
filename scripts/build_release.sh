#!/bin/bash

BASE_DIR=$(dirname "$0")
cd "$BASE_DIR/.."

# Build libde265
emcmake cmake -DCMAKE_BUILD_TYPE=Release -G Ninja -S third_party/libde265 -B build/libde265  || exit 1
cmake --build build/libde265 --target libde265.a  || exit 1
cp build/libde265/libde265/de265-version.h third_party/libde265/libde265

# Build libheif
emcmake cmake -DCMAKE_BUILD_TYPE=Release -G Ninja -S third_party/libheif -B build/libheif \
    -DENABLE_MULTITHREADING_SUPPORT=OFF -DWITH_GDK_PIXBUF=OFF -DWITH_EXAMPLES=OFF \
    -DLIBDE265_INCLUDE_DIR="third_party/libde265" \
    -DLIBDE265_LIBRARY="-Lbuild/libde265/libde265"  || exit 1
cmake --build build/libheif --target libheif.a  || exit 1

# Build wasm
emcc -Wl,--whole-archive build/libheif/libheif/libheif.a -Wl,--no-whole-archive \
    build/libde265/libde265/libde265.a \
    --bind \
    -sALLOW_MEMORY_GROWTH=1 \
    -sMAXIMUM_MEMORY=128MB \
    -sDISABLE_EXCEPTION_CATCHING=1 \
    -o build/libheif.js || exit 1
