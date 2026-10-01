# Flow Kit Desktop â€” á»¨ng dá»¥ng MÃ¡y tÃ­nh Äá»™c láº­p

Há»‡ thá»‘ng á»©ng dá»¥ng Desktop trá»n gÃ³i (All-in-One) cho **Flow Kit**, cho phÃ©p khá»Ÿi cháº¡y giao diá»‡n Ä‘iá»u khiá»ƒn (Dashboard), quáº£n lÃ½ tiáº¿n trÃ¬nh Python FastAPI Backend vÃ  káº¿t ná»‘i Google Flow trá»±c tiáº¿p trÃªn mÃ¡y tÃ­nh mÃ  khÃ´ng cáº§n thao tÃ¡c gÃµ lá»‡nh thá»§ cÃ´ng.

---

## ðŸŒŸ TÃ­nh NÄƒng Ná»•i Báº­t

1. **Khá»Ÿi Ä‘á»™ng 1-Click (`run_desktop.bat`)**:
   - Tá»± Ä‘á»™ng nháº­n diá»‡n mÃ´i trÆ°á»ng Python (`venv` hoáº·c há»‡ thá»‘ng).
   - Tá»± Ä‘á»™ng khá»Ÿi Ä‘á»™ng FastAPI Backend trÃªn cá»•ng `8100` ngáº§m.
   - Hiá»ƒn thá»‹ mÃ n hÃ¬nh chá» (Splash Screen) sang trá»ng trÆ°á»›c khi vÃ o app.
   - Tá»± Ä‘á»™ng táº¯t sáº¡ch toÃ n bá»™ tiáº¿n trÃ¬nh Python ngáº§m khi Ä‘Ã³ng á»©ng dá»¥ng.

2. **Giao diá»‡n Dashboard TÃ­ch há»£p**:
   - Cháº¡y trá»±c tiáº¿p Dashboard quáº£n lÃ½ dá»± Ã¡n, cáº£nh quay, thÆ° viá»‡n video trong cá»­a sá»• Desktop native.
   - Káº¿t ná»‘i WebSocket thá»i gian thá»±c tá»›i Backend (`ws://127.0.0.1:8100/ws/dashboard`).

3. **Cá»­a sá»• Google Flow Session**:
   - PhÃ­m táº¯t `Ctrl + Shift + F`: Má»Ÿ cá»­a sá»• Google Flow ngay bÃªn trong App vá»›i phiÃªn Ä‘Äƒng nháº­p Ä‘Æ°á»£c lÆ°u trá»¯ vÄ©nh viá»…n (`persist:flowkit_google`).
   - Cáº¥u hÃ¬nh sáºµn Chrome User-Agent Ä‘á»ƒ trÃ¡nh bá»‹ Google cháº·n Ä‘Äƒng nháº­p.
   - TÃ¹y chá»n má»Ÿ trÃªn trÃ¬nh duyá»‡t Google Chrome ngoÃ i náº¿u muá»‘n.

4. **Tiá»‡n Ã­ch TÃ­ch há»£p**:
   - PhÃ­m táº¯t `Ctrl + Shift + O`: Má»Ÿ nhanh thÆ° má»¥c video xuáº¥t báº£n (`output/`).
   - Khá»Ÿi Ä‘á»™ng láº¡i Backend nhanh tá»« Menu há»‡ thá»‘ng.
   - Tá»± Ä‘á»™ng náº¡p Chrome Extension cáº§u ná»‘i (`extension/`).

---

## ðŸš€ CÃ¡ch Sá»­ Dá»¥ng

### CÃ¡ch 1: Cháº¡y nhanh báº±ng file Batch (KhuyÃªn dÃ¹ng khi phÃ¡t triá»ƒn/sá»­ dá»¥ng)
Nháº¥p Ä‘Ãºp chuá»™t vÃ o file:
```
run_desktop.bat
```
ngay táº¡i thÆ° má»¥c gá»‘c cá»§a dá»± Ã¡n. File nÃ y sáº½ tá»± kiá»ƒm tra báº£n build Dashboard vÃ  má»Ÿ App Desktop ngay láº­p tá»©c.

### CÃ¡ch 2: Cháº¡y qua dÃ²ng lá»‡nh
```bash
# 1. Di chuyá»ƒn vÃ o thÆ° má»¥c desktop
cd desktop

# 2. Khá»Ÿi cháº¡y á»©ng dá»¥ng
npm start
```

---

## ðŸ“¦ ÄÃ³ng gÃ³i thÃ nh file `.exe` cÃ i Ä‘áº·t hoáº·c Portable

Trong thÆ° má»¥c `desktop`:

```bash
# ÄÃ³ng gÃ³i báº£n Portable (file .exe cháº¡y ngay khÃ´ng cáº§n cÃ i Ä‘áº·t)
npm run dist:portable

# ÄÃ³ng gÃ³i báº£n Bá»™ cÃ i Ä‘áº·t Windows (NSIS Installer)
npm run dist:installer
```

Sau khi hoÃ n táº¥t, file `.exe` sáº½ náº±m trong thÆ° má»¥c `desktop/release/`.
