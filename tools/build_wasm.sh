#!/bin/bash
set -e

SCRIPTS_DIR=$(dirname "$0")
cd "$SCRIPTS_DIR/.."

# Var
BUILD_TYPE="${1:-debug}"
BUILD_DIR="build/${BUILD_TYPE}"
LIBDE265_SOURCE_DIR="third_party/libde265"
LIBDE265_BUILD_DIR="${BUILD_DIR}/libde265"
DAV1D_SOURCE_DIR="third_party/dav1d"
DAV1D_BUILD_DIR="${BUILD_DIR}/dav1d"
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

if [ "$2" == "es6" ]; then
    LINK_ES6="-sEXPORT_ES6"
else
    LINK_ES6=""
fi

# Build libde265
emcmake cmake -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE} -G Ninja -S ${LIBDE265_SOURCE_DIR} -B ${LIBDE265_BUILD_DIR}
cmake --build ${LIBDE265_BUILD_DIR} --target libde265.a
cp ${LIBDE265_BUILD_DIR}/libde265/de265-version.h ${LIBDE265_SOURCE_DIR}/libde265

# Build dav1d
meson setup --buildtype=${BUILD_TYPE} --backend=ninja --default-library=static --cross-file=tools/wasm.cross \
    ${DAV1D_BUILD_DIR} ${DAV1D_SOURCE_DIR}
ninja -C ${DAV1D_BUILD_DIR} "src/libdav1d.a"
cp ${DAV1D_BUILD_DIR}/include/dav1d/version.h ${DAV1D_SOURCE_DIR}/include/dav1d

# Build libheif
git -C ${LIBHEIF_SOURCE_DIR} checkout -f
git -C ${LIBHEIF_SOURCE_DIR} apply ../../patches/libheif.patch
emcmake cmake -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE} -G Ninja -S ${LIBHEIF_SOURCE_DIR} -B ${LIBHEIF_BUILD_DIR} \
    -DENABLE_MULTITHREADING_SUPPORT=OFF -DWITH_GDK_PIXBUF=OFF -DWITH_EXAMPLES=OFF -DENABLE_PLUGIN_LOADING=OFF \
    -DLIBDE265_INCLUDE_DIR="${LIBDE265_SOURCE_DIR}" \
    -DLIBDE265_LIBRARY="-L${LIBDE265_BUILD_DIR}/libde265" \
    -DDAV1D_INCLUDE_DIR="${DAV1D_SOURCE_DIR}/include" \
    -DDAV1D_LIBRARY="-L${DAV1D_BUILD_DIR}/src"
cmake --build ${LIBHEIF_BUILD_DIR} --target libheif.a
rm -f ${LIBDE265_SOURCE_DIR}/libde265/de265-version.h
rm -f ${DAV1D_SOURCE_DIR}/include/dav1d/version.h
git -C ${LIBHEIF_SOURCE_DIR} checkout -f

# Build wasm
emcc -Wl,--whole-archive ${LIBHEIF_BUILD_DIR}/libheif/libheif.a -Wl,--no-whole-archive \
    ${LIBDE265_BUILD_DIR}/libde265/libde265.a \
    ${DAV1D_BUILD_DIR}/src/libdav1d.a \
    --bind \
    -sALLOW_MEMORY_GROWTH=1 \
    -sMAXIMUM_MEMORY=512MB \
    -sDISABLE_EXCEPTION_CATCHING=1 \
    -sMODULARIZE \
    ${LINK_ES6} \
    -O${LINK_OPTIMIZATIONS} \
    -o ${BUILD_DIR}/libheif.js
