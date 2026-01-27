# Lokale Installatie - Landbouw Museum Kiosk

## Vereisten

1. **XAMPP** (voor PHP/MySQL backend)  
   Download: https://www.apachefriends.org/
   
2. **Node.js** v18+  
   Download: https://nodejs.org/

3. **Google Chrome** of **Microsoft Edge**

---

## Installatie Stappen

### 1. Backend Installeren

```bash
# Kopieer backend naar XAMPP htdocs
xcopy /E /I "backend" "C:\xampp\htdocs\Landbouw-Interactieve-Scherm\backend"
```

### 2. Database Configureren

1. Start XAMPP Control Panel
2. Start **Apache** en **MySQL**
3. Open http://localhost/phpmyadmin
4. Maak database `landbouw_museum` aan
5. Importeer bestaande data (indien beschikbaar)

### 3. Frontend Bouwen

```bash
cd frontend
npm install
npm run build
```

---

## Applicatie Starten

### Automatisch (Aanbevolen)
Dubbelklik op:
```
scripts\start-kiosk.bat
```

### Handmatig

1. **Start XAMPP** (Apache + MySQL)

2. **Start frontend preview server:**
   ```bash
   cd frontend
   npm run preview -- --port 5173 --host
   ```

3. **Start browser in kiosk mode:**
   ```bash
   chrome.exe --kiosk --disable-pinch --start-fullscreen http://localhost:5173
   ```

---

## Applicatie Stoppen

Dubbelklik op:
```
scripts\stop-kiosk.bat
```

Of druk `Alt+F4` in kiosk mode.

---

## Kiosk Mode Opties (Chrome/Edge)

| Optie | Functie |
|-------|---------|
| `--kiosk` | Fullscreen zonder UI |
| `--disable-pinch` | Geen pinch-to-zoom |
| `--start-fullscreen` | Direct fullscreen |
| `--noerrdialogs` | Geen foutmeldingen |
| `--disable-translate` | Geen vertaalmelding |

---

## Problemen Oplossen

**"API niet bereikbaar"**  
→ Controleer of Apache draait in XAMPP

**"Database error"**  
→ Controleer of MySQL draait en database bestaat

**"Frontend laadt niet"**  
→ Run `npm run build` in frontend folder
