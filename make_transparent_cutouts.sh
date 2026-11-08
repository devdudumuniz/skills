for name in carcara lobo_guara tatu_bola ararinha; do
  echo "--- Refining $name transparent cutout ---"
  TOP_COL=$(convert public/assets/mascotes/${name}.jpg -format "%[pixel:p{5,5}]" info:)
  BOT_COL=$(convert public/assets/mascotes/${name}.jpg -format "%[pixel:p{5,1018}]" info:)
  MID_LEFT_COL=$(convert public/assets/mascotes/${name}.jpg -format "%[pixel:p{5,512}]" info:)
  MID_RIGHT_COL=$(convert public/assets/mascotes/${name}.jpg -format "%[pixel:p{1018,512}]" info:)
  
  # Step 1: Floodfill from top corners with TOP_COL
  convert public/assets/mascotes/${name}.jpg \
    -bordercolor "$TOP_COL" -border 1 \
    -fuzz 19% -fill none -floodfill +0+0 "$TOP_COL" \
    -floodfill +1024+0 "$TOP_COL" \
    -shave 1x1 \
    public/assets/mascotes/${name}_transparent.png

  # Step 2: Floodfill from bottom corners with BOT_COL
  convert public/assets/mascotes/${name}_transparent.png \
    -bordercolor "$BOT_COL" -border 1 \
    -fuzz 22% -fill none -floodfill +0+1024 "$BOT_COL" \
    -floodfill +1024+1024 "$BOT_COL" \
    -shave 1x1 \
    public/assets/mascotes/${name}_transparent.png

  # Step 3: Floodfill from mid left/right if still tinted
  convert public/assets/mascotes/${name}_transparent.png \
    -bordercolor "$MID_LEFT_COL" -border 1 \
    -fuzz 18% -fill none -floodfill +0+512 "$MID_LEFT_COL" \
    -floodfill +1024+512 "$MID_RIGHT_COL" \
    -shave 1x1 \
    public/assets/mascotes/${name}_transparent.png
    
  # Also overwrite hd.png with the transparent version!
  cp public/assets/mascotes/${name}_transparent.png public/assets/mascotes/${name}_hd.png
  
  echo "Result for $name:"
  convert public/assets/mascotes/${name}_transparent.png -format "TopL: %[pixel:p{10,10}], BotL: %[pixel:p{10,1014}], BotR: %[pixel:p{1014,1014}], Alpha mean: %[fx:mean.a]\n" info:
done
