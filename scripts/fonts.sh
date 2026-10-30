#!/bin/sh
# Gera as fontes da versão web (public/fonts): só os caracteres latinos e em woff2, ~140 KB no total
# em vez dos ~740 KB dos .ttf. O app de Android e iPhone continua usando os .ttf dos pacotes.
# Precisa do fontTools com brotli: python3 -m pip install fonttools brotli
set -e
cd "$(dirname "$0")/.."
U="U+0000-017F,U+0300-036F,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2715"
N=node_modules/@expo-google-fonts
for pair in \
  anton/400Regular/Anton_400Regular:anton-400 \
  barlow-condensed/400Regular/BarlowCondensed_400Regular:barlow-400 \
  barlow-condensed/500Medium/BarlowCondensed_500Medium:barlow-500 \
  barlow-condensed/600SemiBold/BarlowCondensed_600SemiBold:barlow-600 \
  barlow-condensed/700Bold/BarlowCondensed_700Bold:barlow-700 \
  oswald/500Medium/Oswald_500Medium:oswald-500 \
  oswald/600SemiBold/Oswald_600SemiBold:oswald-600; do
  pyftsubset "$N/${pair%%:*}.ttf" --unicodes="$U" --layout-features='kern,liga,tnum,lnum,case' \
    --flavor=woff2 --output-file="public/fonts/${pair##*:}.woff2"
done
