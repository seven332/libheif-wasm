#!/bin/bash
set -e

SCRIPTS_DIR=$(dirname "$0")
cd "$SCRIPTS_DIR/.."

# Var
BUILD_TYPE="${1:-debug}"
BUILD_DIR="build/${BUILD_TYPE}"
LIBDE265_SOURCE_DIR="third_party/libde265"
LIBDE265_BUILD_DIR="${BUILD_DIR}/libde265"
LIBHEIF_SOURCE_DIR="third_party/libheif"
LIBHEIF_BUILD_DIR="${BUILD_DIR}/libheif"

if [ $BUILD_TYPE == "debug" ]; then
    CMAKE_BUILD_TYPE="Debug"
    LINK_OPTIMIZATIONS=0
elif [ $BUILD_TYPE == "release" ]; then
    CMAKE_BUILD_TYPE="Release"
    LINK_OPTIMIZATIONS=3
else
    echo "Unknown build type: ${BUILD_TYPE}"
fi

# Build libde265
emcmake cmake -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE} -G Ninja -S ${LIBDE265_SOURCE_DIR} -B ${LIBDE265_BUILD_DIR}
cmake --build ${LIBDE265_BUILD_DIR} --target libde265.a
cp ${LIBDE265_BUILD_DIR}/libde265/de265-version.h ${LIBDE265_SOURCE_DIR}/libde265

# Build libheif
emcmake cmake -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE} -G Ninja -S ${LIBHEIF_SOURCE_DIR} -B ${LIBHEIF_BUILD_DIR} \
    -DENABLE_MULTITHREADING_SUPPORT=OFF -DWITH_GDK_PIXBUF=OFF -DWITH_EXAMPLES=OFF \
    -DLIBDE265_INCLUDE_DIR="${LIBDE265_SOURCE_DIR}" \
    -DLIBDE265_LIBRARY="-L${LIBDE265_BUILD_DIR}/libde265"
cmake --build ${LIBHEIF_BUILD_DIR} --target libheif.a

# Build wasm
emcc -Wl,--whole-archive ${LIBHEIF_BUILD_DIR}/libheif/libheif.a -Wl,--no-whole-archive \
    ${LIBDE265_BUILD_DIR}/libde265/libde265.a \
    --bind \
    -sALLOW_MEMORY_GROWTH=1 \
    -sMAXIMUM_MEMORY=128MB \
    -sDISABLE_EXCEPTION_CATCHING=1 \
    -sMODULARIZE \
    -O${LINK_OPTIMIZATIONS} \
    -o ${BUILD_DIR}/libheif.js
cp ${BUILD_DIR}/libheif.js src/libheif.js
cp ${BUILD_DIR}/libheif.wasm src/libheif.wasm
