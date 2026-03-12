from PIL import Image
from collections import Counter

def analyze_image(path):
    try:
        img = Image.open(path)
        img = img.convert("RGBA")
        # Resize for faster processing
        img = img.resize((100, 100))
        pixels = []
        for x in range(img.width):
            for y in range(img.height):
                r, g, b, a = img.getpixel((x, y))
                if a > 50:  # Valid opacity
                    # Skip basic white/black for "primary" color detection
                    if (r > 240 and g > 240 and b > 240): continue # White-ish
                    if (r < 15 and g < 15 and b < 15): continue   # Black-ish
                    pixels.append((r, g, b))
        
        if not pixels:
            print("No valid pixels found")
            return

        counts = Counter(pixels)
        common = counts.most_common(5)
        
        print("TOP COLORS:")
        for color, count in common:
            hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
            print(f"{hex_color} (count: {count})")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_image('public/assets/chatbotimg.png')
