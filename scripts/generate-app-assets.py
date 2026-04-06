#!/usr/bin/env python3
import os
import struct
import zlib


def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    return (
        struct.pack('!I', len(data))
        + chunk_type
        + data
        + struct.pack('!I', zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
    )


def write_png(path: str, width: int, height: int, rgb):
    r, g, b = rgb
    row = b'\x00' + bytes([r, g, b]) * width
    raw = row * height

    ihdr = struct.pack('!IIBBBBB', width, height, 8, 2, 0, 0, 0)
    idat = zlib.compress(raw, 9)

    png = b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR', ihdr) + png_chunk(b'IDAT', idat) + png_chunk(b'IEND', b'')

    with open(path, 'wb') as f:
        f.write(png)


def main():
    os.makedirs('assets', exist_ok=True)
    write_png('assets/icon.png', 1024, 1024, (29, 78, 216))
    write_png('assets/adaptive-icon.png', 1024, 1024, (15, 23, 42))
    write_png('assets/splash.png', 1242, 2436, (11, 18, 32))
    write_png('assets/favicon.png', 48, 48, (29, 78, 216))
    print('Generated default app assets in assets/')


if __name__ == '__main__':
    main()
