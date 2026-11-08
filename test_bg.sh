for name in carcara lobo_guara tatu_bola ararinha; do
  echo "Processing $name..."
  # Sample corner color
  BG_COL=$(convert public/assets/mascotes/${name}.jpg -format "%[pixel:p{5,5}]" info:)
  echo "$name bg: $BG_COL"
  
  # Floodfill from (0,0), (width, 0), (0, height), (width, height)
  convert public/assets/mascotes/${name}.jpg \
    -bordercolor "$BG_COL" -border 1 \
    -fuzz 18% -fill none -floodfill +0+0 "$BG_COL" \
    -shave 1x1 \
    public/assets/mascotes/${name}_transparent.png
    
  echo "$name transparent size: $(ls -lh public/assets/mascotes/${name}_transparent.png | awk '{print $5}')"
done
