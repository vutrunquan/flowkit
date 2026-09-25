"""Material registry — built-in and custom visual styles for image generation."""

_BUILTIN_IDS: frozenset[str] = frozenset({
    "custom", "stickman_2d", "chalkboard", "paper_cutout", "rubber_hose_30s",
    "pencil_sketch", "gothic_ink", "ukiyo_e", "film_noir", "vintage_polaroid",
    "wes_anderson", "tilt_shift", "stained_glass", "pixel_art", "synthwave",
    "felt_puppet", "realistic", "3d_pixar", "anime", "ghibli", "stop_motion",
    "minecraft", "oil_painting", "watercolor", "comic_book", "cyberpunk",
    "claymation", "lego", "retro_vhs",
})

MATERIALS: dict[str, dict] = {
    "custom": {
        "id": "custom",
        "name": "Không áp dụng / Tự do (Custom Prompt)",
        "style_instruction": "High quality visual rendering, highly detailed.",
        "negative_prompt": None,
        "scene_prefix": "",
        "lighting": "Balanced lighting, highly detailed",
    },
    "stickman_2d": {
        "id": "stickman_2d",
        "name": "2D Stickman Cartoon (Người que minh hoạ)",
        "style_instruction": (
            "Minimalist 2D cartoon illustration, stylized expressive stickman character with bold clean black ink outlines, "
            "round white face, expressive dot eyes and eyebrow lines, messy dark hair, simple stick limbs, "
            "wearing flat-colored outfits with clean cell shading. Webcomic and animated educational documentary style, clean vector aesthetic."
        ),
        "negative_prompt": (
            "NOT 3D render, NOT realistic, NOT photograph, NOT CGI, NOT anime, "
            "NOT complex gradients, NOT blurry, NOT detailed realistic anatomy, NOT hyper-realistic."
        ),
        "scene_prefix": (
            "Minimalist 2D cartoon style, expressive stickman illustration, bold black ink outlines, clean flat colors."
        ),
        "lighting": "Flat graphic lighting, clean and bright",
    },
    "chalkboard": {
        "id": "chalkboard",
        "name": "Chalkboard Art (Vẽ phấn bảng đen)",
        "style_instruction": (
            "Hand-drawn white and light-gray chalk illustration on a dark, dusty charcoal-black classroom chalkboard, "
            "muted cyan accent, visible chalk dust and erased smudges, flat 2D photographed-chalk aesthetic, "
            "straight-on stable documentary framing."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT 3D render, NOT anime, NOT gradients, NOT glossy vector look, "
            "NOT modern UI, NOT clean digital art."
        ),
        "scene_prefix": (
            "Chalkboard drawing style, hand-drawn chalk on dark chalkboard, visible dust smudges."
        ),
        "lighting": "Classroom ambient lighting, natural dusty light",
    },
    "paper_cutout": {
        "id": "paper_cutout",
        "name": "Paper Cutout 3D (Cắt giấy xếp lớp)",
        "style_instruction": (
            "Multi-layered paper cutout craft illustration, layered craft paper sheets creating depth and depth-of-field, "
            "subtle paper texture, gentle drop shadows between paper layers, clean hand-cut paper silhouette edges."
        ),
        "negative_prompt": (
            "NOT 3D CGI, NOT glossy, NOT photorealistic person, NOT plastic, NOT digital paint."
        ),
        "scene_prefix": (
            "Layered paper cutout craft style, dimensional cut paper layers, soft shadow depth."
        ),
        "lighting": "Warm soft directional papercraft lighting with gentle cast shadows",
    },
    "rubber_hose_30s": {
        "id": "rubber_hose_30s",
        "name": "1930s Rubber Hose (Hoạt hình cổ điển 1930s)",
        "style_instruction": (
            "1930s vintage cartoon animation style, rubber hose limbs, pie eyes, bold ink line art, "
            "classic black and white or aged sepia palette, vintage film grain, faint projector flicker and dust artifacts, "
            "retro theatrical animation aesthetic."
        ),
        "negative_prompt": (
            "NOT modern digital art, NOT 3D CGI, NOT sharp vector, NOT anime, NOT photorealistic."
        ),
        "scene_prefix": (
            "1930s rubber hose vintage cartoon style, pie eyes, bendy limbs, film grain and dust."
        ),
        "lighting": "Vintage monochrome animation cel lighting",
    },
    "pencil_sketch": {
        "id": "pencil_sketch",
        "name": "Pencil & Charcoal Sketch (Phác thảo chì than)",
        "style_instruction": (
            "Hand-drawn graphite pencil and charcoal sketch on textured off-white art paper, "
            "visible expressive cross-hatching, fine line details, artistic shading smudges, academic atelier drawing style."
        ),
        "negative_prompt": (
            "NOT digital vector, NOT 3D render, NOT colored photography, NOT glossy, NOT CGI."
        ),
        "scene_prefix": (
            "Fine pencil and charcoal sketch, expressive cross-hatching on textured paper."
        ),
        "lighting": "Studio natural drawing light, rich graphite contrast",
    },
    "gothic_ink": {
        "id": "gothic_ink",
        "name": "Gothic Dark Fantasy (Tranh mực u tối)",
        "style_instruction": (
            "Dark fantasy gothic ink illustration, intricate black ink hatching and stippling, "
            "high contrast chiaroscuro, grim dark aesthetic, highly detailed dark medieval linework."
        ),
        "negative_prompt": (
            "NOT cheerful, NOT pastel, NOT 3D render, NOT glossy, NOT cartoon, NOT modern."
        ),
        "scene_prefix": (
            "Gothic dark fantasy ink illustration, heavy black ink hatching, moody contrast."
        ),
        "lighting": "Dramatic high contrast rim lighting, deep shadows",
    },
    "ukiyo_e": {
        "id": "ukiyo_e",
        "name": "Ukiyo-e Woodblock (Tranh mộc bản Nhật Bản)",
        "style_instruction": (
            "Traditional Japanese Ukiyo-e woodblock print style, bold woodcut outlines, "
            "flat mineral pigment color washes, patterned waves and clouds, handmade washi paper texture, Edo period fine art print."
        ),
        "negative_prompt": (
            "NOT 3D CGI, NOT modern photograph, NOT western comic, NOT glossy, NOT digital anime."
        ),
        "scene_prefix": (
            "Traditional Japanese Ukiyo-e woodblock print style, washi paper texture, mineral pigments."
        ),
        "lighting": "Soft flat traditional woodblock print illumination",
    },
    "film_noir": {
        "id": "film_noir",
        "name": "Film Noir (Điện ảnh đen trắng 1940s)",
        "style_instruction": (
            "Classic 1940s-1950s Film Noir cinema cinematography, high-contrast black and white 35mm film, "
            "dramatic venetian blind shadows, hazy cigarette smoke, wet asphalt street reflections, mysterious low-angle framing."
        ),
        "negative_prompt": (
            "NOT color, NOT modern digital video, NOT 3D render, NOT cartoon, NOT bright daytime."
        ),
        "scene_prefix": (
            "Classic black and white Film Noir cinematography, high-contrast shadows, 35mm film grain."
        ),
        "lighting": "Hard chiaroscuro key lighting, dramatic low-angle shadows",
    },
    "vintage_polaroid": {
        "id": "vintage_polaroid",
        "name": "Vintage Polaroid 35mm (Phim ảnh 70s-90s)",
        "style_instruction": (
            "Vintage 1970s-1980s color photography on Kodak Portra 35mm film, warm nostalgic color tones, "
            "authentic film grain, subtle lens softness, gentle light leaks, timeless analog aesthetic."
        ),
        "negative_prompt": (
            "NOT ultra-sharp digital 4K, NOT 3D render, NOT cartoon, NOT CGI, NOT oversaturated HDR."
        ),
        "scene_prefix": (
            "Vintage 35mm Kodak film photography, warm nostalgic tone, authentic film grain."
        ),
        "lighting": "Golden hour natural sunlight, warm analog glow",
    },
    "wes_anderson": {
        "id": "wes_anderson",
        "name": "Wes Anderson Aesthetic (Đối xứng màu Pastel)",
        "style_instruction": (
            "Wes Anderson cinematic style, perfectly symmetrical centered framing, curated pastel color palette (mustard yellow, mint green, dusty pink), "
            "meticulous vintage set design, whimsical deadpan mood, 35mm film texture."
        ),
        "negative_prompt": (
            "NOT tilted camera, NOT chaotic framing, NOT dark gritty, NOT 3D render, NOT high contrast neon."
        ),
        "scene_prefix": (
            "Wes Anderson style, perfectly symmetrical composition, whimsical pastel palette."
        ),
        "lighting": "Bright, flat, evenly balanced cinematic lighting",
    },
    "tilt_shift": {
        "id": "tilt_shift",
        "name": "Tilt-Shift Miniature (Mô hình tí hon)",
        "style_instruction": (
            "Tilt-shift miniature photography, extremely shallow depth of field with sharp focal band and blurred top/bottom, "
            "high vantage angle, making real scenes look like tiny handcrafted diorama toys."
        ),
        "negative_prompt": (
            "NOT flat focus, NOT wide DOF, NOT cartoon, NOT 3D low-poly."
        ),
        "scene_prefix": (
            "Tilt-shift macro miniature photography, toy diorama look, shallow depth of field."
        ),
        "lighting": "Bright sunny overhead miniature illumination",
    },
    "stained_glass": {
        "id": "stained_glass",
        "name": "Stained Glass (Tranh kính màu Gothic)",
        "style_instruction": (
            "Gothic cathedral stained glass window art, luminous vibrant colored glass panes bound by thick dark lead came linework, "
            "radiant light glowing through translucent colored glass, sacred medieval mosaic aesthetic."
        ),
        "negative_prompt": (
            "NOT photograph, NOT 3D render, NOT anime, NOT flat digital art."
        ),
        "scene_prefix": (
            "Gothic stained glass window style, glowing colored glass, dark lead came outlines."
        ),
        "lighting": "Radiant backlighting glowing through translucent colored glass",
    },
    "pixel_art": {
        "id": "pixel_art",
        "name": "Pixel Art 16-bit (Game Retro)",
        "style_instruction": (
            "16-bit retro pixel art game aesthetic, crisp pixel grid resolution, curated color palette with dithered shading, "
            "nostalgic Super Nintendo and Sega Genesis video game screenshot feel."
        ),
        "negative_prompt": (
            "NOT vector, NOT high-res smooth curves, NOT 3D render, NOT photograph, NOT blurry."
        ),
        "scene_prefix": (
            "16-bit retro pixel art game style, crisp pixel grid, dithered shading."
        ),
        "lighting": "Chiptune arcade ambient lighting",
    },
    "synthwave": {
        "id": "synthwave",
        "name": "Synthwave 80s (Outrun Neon Retro)",
        "style_instruction": (
            "1980s Synthwave and Outrun retro-futuristic aesthetic, wireframe 3D grid horizon, glowing neon purple, magenta, and cyan lights, "
            "giant glowing striped sun, chrome reflections, dark starry night sky."
        ),
        "negative_prompt": (
            "NOT daylight, NOT natural landscape, NOT cartoon, NOT realistic historical."
        ),
        "scene_prefix": (
            "Synthwave 80s outrun style, neon magenta and cyan, wireframe horizon grid."
        ),
        "lighting": "Glowing neon rim lighting, volumetric laser haze",
    },
    "felt_puppet": {
        "id": "felt_puppet",
        "name": "Felt Puppets (Rối nỉ xù thủ công)",
        "style_instruction": (
            "Handcrafted felt puppet style, visible fuzzy wool fleece and felt fabric textures, "
            "plastic button eyes, stitched fabric seams, physical puppet workshop craft aesthetic, Jim Henson Muppet-like charm."
        ),
        "negative_prompt": (
            "NOT smooth CGI, NOT 3D digital, NOT photorealistic human, NOT cartoon 2D."
        ),
        "scene_prefix": (
            "Handmade felt puppet style, fuzzy felt wool texture, miniature practical set."
        ),
        "lighting": "Warm practical stage lighting, soft shadows",
    },
    "realistic": {
        "id": "realistic",
        "name": "Photorealistic",
        "style_instruction": (
            "Photorealistic RAW photograph, shot on Canon EOS R5, 35mm lens, "
            "natural available light, real footage."
        ),
        "negative_prompt": (
            "NOT 3D render, NOT CGI, NOT digital art, NOT illustration, "
            "NOT anime, NOT painting, NOT cartoon."
        ),
        "scene_prefix": (
            "Real RAW photograph, shot on Canon EOS R5, 35mm lens, "
            "natural available light."
        ),
        "lighting": "Studio lighting, highly detailed",
    },
    "3d_pixar": {
        "id": "3d_pixar",
        "name": "3D Pixar",
        "style_instruction": (
            "3D animated style, Pixar-quality rendering, Disney-Pixar aesthetic. "
            "Smooth subsurface scattering skin, expressive cartoon eyes, "
            "stylized proportions, vibrant saturated colors."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT photograph, NOT live action, NOT anime, "
            "NOT flat 2D."
        ),
        "scene_prefix": (
            "3D animated Pixar-quality rendering, vibrant colors, "
            "cinematic lighting."
        ),
        "lighting": "Studio lighting, global illumination, highly detailed",
    },
    "anime": {
        "id": "anime",
        "name": "Anime",
        "style_instruction": (
            "Japanese anime style, cel-shaded rendering, vibrant saturated colors, "
            "clean sharp linework, large expressive eyes, stylized anatomy. "
            "High-quality anime production, studio Ghibli meets modern anime aesthetic."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT 3D render, NOT oil painting, "
            "NOT sketch, NOT watercolor, NOT Western cartoon."
        ),
        "scene_prefix": (
            "Anime style, cel-shaded, vibrant colors, clean linework, "
            "dramatic anime lighting."
        ),
        "lighting": "Anime-style dramatic lighting, highly detailed",
    },
    "stop_motion": {
        "id": "stop_motion",
        "name": "Felt & Wood Stop Motion",
        "style_instruction": (
            "Stop-motion animation style with handcrafted felt and wood puppets. "
            "Visible felt fabric texture, wooden joints and dowels, "
            "miniature handmade set pieces, warm craft workshop lighting. "
            "Laika Studios / Wes Anderson stop-motion aesthetic."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT 3D render, NOT digital, NOT anime, "
            "NOT smooth surfaces, NOT plastic."
        ),
        "scene_prefix": (
            "Stop-motion style, handcrafted felt and wood puppets, "
            "miniature set, warm workshop lighting."
        ),
        "lighting": "Warm practical miniature lighting, macro photography detail",
    },
    "minecraft": {
        "id": "minecraft",
        "name": "Minecraft",
        "style_instruction": (
            "Minecraft voxel art style, blocky cubic geometry, pixel textures, "
            "16x16 texture resolution aesthetic, square heads and bodies. "
            "Everything made of cubes and rectangular prisms. "
            "Minecraft game screenshot aesthetic."
        ),
        "negative_prompt": (
            "NOT smooth, NOT round, NOT photorealistic, NOT anime, "
            "NOT organic curves, NOT high-poly."
        ),
        "scene_prefix": (
            "Minecraft style, blocky voxel world, pixel textures, "
            "cubic geometry, game screenshot aesthetic."
        ),
        "lighting": "Minecraft-style ambient lighting, block shadows",
    },
    "oil_painting": {
        "id": "oil_painting",
        "name": "Oil Painting",
        "style_instruction": (
            "Classical oil painting on canvas, visible thick brushstrokes, "
            "rich impasto texture, warm color palette, chiaroscuro lighting. "
            "Renaissance masters meets impressionist technique. "
            "Museum-quality fine art painting."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT digital art, NOT 3D render, NOT anime, "
            "NOT flat colors, NOT cartoon."
        ),
        "scene_prefix": (
            "Oil painting style, visible brushstrokes, rich impasto texture, "
            "warm palette, dramatic chiaroscuro lighting."
        ),
        "lighting": "Dramatic chiaroscuro lighting, rich tonal depth",
    },
    "ghibli": {
        "id": "ghibli",
        "name": "Studio Ghibli",
        "style_instruction": (
            "Studio Ghibli anime style, hand-painted watercolor backgrounds, "
            "soft pastel colors, gentle rounded character designs, whimsical atmosphere. "
            "Hayao Miyazaki aesthetic, detailed natural environments, magical realism."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT 3D render, NOT dark, NOT gritty, "
            "NOT sharp edges, NOT Western cartoon."
        ),
        "scene_prefix": (
            "Studio Ghibli anime style, hand-painted watercolor backgrounds, "
            "soft pastel colors, gentle whimsical atmosphere."
        ),
        "lighting": "Soft natural Ghibli lighting, golden hour warmth, dappled sunlight",
    },
    "watercolor": {
        "id": "watercolor",
        "name": "Watercolor",
        "style_instruction": (
            "Soft watercolor painting on cold-press paper, loose wet brushwork, "
            "translucent color washes bleeding into each other, white paper showing through. "
            "Delicate ink outlines, impressionistic and dreamy."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT 3D render, NOT digital art, NOT anime, "
            "NOT sharp edges, NOT bold outlines."
        ),
        "scene_prefix": (
            "Watercolor painting style, soft wet brushwork, "
            "translucent color washes, delicate ink outlines."
        ),
        "lighting": "Soft diffused natural light, watercolor wash",
    },
    "comic_book": {
        "id": "comic_book",
        "name": "Comic Book",
        "style_instruction": (
            "American comic book art style, bold black ink outlines, flat vibrant colors "
            "with halftone dot shading, dynamic action poses, dramatic foreshortening. "
            "Marvel/DC superhero comic aesthetic, Ben-Day dots, speech bubble ready."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT 3D render, NOT anime, NOT watercolor, "
            "NOT soft edges, NOT muted colors."
        ),
        "scene_prefix": (
            "Comic book style, bold ink outlines, vibrant flat colors, "
            "halftone shading, dynamic composition."
        ),
        "lighting": "High contrast comic lighting, dramatic shadows, rim light",
    },
    "cyberpunk": {
        "id": "cyberpunk",
        "name": "Cyberpunk",
        "style_instruction": (
            "Cyberpunk sci-fi aesthetic, neon-lit dark urban environment, "
            "holographic displays, rain-slicked streets reflecting neon signs. "
            "Blade Runner meets Ghost in the Shell, high-tech low-life, "
            "chrome and glass, purple and cyan color palette."
        ),
        "negative_prompt": (
            "NOT natural environment, NOT bright daylight, NOT historical, "
            "NOT cartoon, NOT fantasy medieval."
        ),
        "scene_prefix": (
            "Cyberpunk aesthetic, neon-lit dark urban, holographic displays, "
            "rain-slicked streets, purple and cyan neon."
        ),
        "lighting": "Neon rim lighting, volumetric fog, cyan and magenta",
    },
    "claymation": {
        "id": "claymation",
        "name": "Claymation",
        "style_instruction": (
            "Clay animation style, characters made of modeling clay with visible "
            "fingerprint textures, slightly imperfect sculpted features. "
            "Wallace & Gromit / Aardman aesthetic, miniature handmade sets, "
            "warm practical lighting on tiny clay world."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT digital, NOT anime, NOT smooth skin, "
            "NOT 3D render, NOT glass or metal surfaces."
        ),
        "scene_prefix": (
            "Claymation style, clay puppet characters with fingerprint textures, "
            "miniature handmade sets, warm practical lighting."
        ),
        "lighting": "Warm miniature set lighting, soft shadows, macro detail",
    },
    "lego": {
        "id": "lego",
        "name": "LEGO",
        "style_instruction": (
            "LEGO brick style, characters are LEGO minifigures with yellow skin "
            "and claw hands, environments built entirely from LEGO bricks and plates. "
            "Visible brick studs, ABS plastic texture, The LEGO Movie aesthetic."
        ),
        "negative_prompt": (
            "NOT photorealistic, NOT organic, NOT smooth, NOT anime, "
            "NOT round shapes, NOT natural materials."
        ),
        "scene_prefix": (
            "LEGO style, minifigure characters, brick-built environments, "
            "visible studs, plastic ABS texture."
        ),
        "lighting": "Bright toy photography lighting, sharp focus, product shot quality",
    },
    "retro_vhs": {
        "id": "retro_vhs",
        "name": "Retro VHS",
        "style_instruction": (
            "1980s VHS tape aesthetic, analog video noise and scan lines, "
            "slightly washed-out warm colors, CRT TV curvature, tracking artifacts. "
            "Retro camcorder footage feel, date stamp overlay, nostalgic grain."
        ),
        "negative_prompt": (
            "NOT modern, NOT 4K, NOT clean, NOT digital, NOT anime, "
            "NOT sharp, NOT high-definition."
        ),
        "scene_prefix": (
            "Retro VHS style, analog scan lines, warm washed-out colors, "
            "CRT curvature, nostalgic 80s grain."
        ),
        "lighting": "Warm tungsten lighting, CRT glow, analog video bloom",
    },
}


def get_material(material_id: str) -> dict | None:
    """Get built-in or custom material by ID."""
    return MATERIALS.get(material_id)


def list_materials() -> list[dict]:
    """List all available materials (built-in + custom)."""
    return list(MATERIALS.values())


def register_material(material: dict) -> None:
    """Register a custom material at runtime."""
    if material["id"] in _BUILTIN_IDS:
        raise ValueError(f"Cannot override built-in material '{material['id']}'")
    MATERIALS[material["id"]] = material
