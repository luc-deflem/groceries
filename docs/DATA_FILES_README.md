# 📁 Data Files Guide

Your grocery app now stores data in JSON files alongside your HTML files. This makes your data portable, version-controllable, and easily editable.

## 📄 Data Files

### `shopping-items.json`
Contains your current shopping list items:
```json
[
  {
    "id": 1640995200000,
    "name": "Bananas", 
    "category": "produce",
    "completed": false,
    "dateAdded": "2024-01-01T10:00:00.000Z",
    "fromStandard": false
  }
]
```

### `pantry-items.json` 
Contains your standard pantry stock items:
```json
[
  {
    "id": 1640995400000,
    "name": "Rice",
    "category": "pantry", 
    "inStock": true,
    "dateAdded": "2024-01-01T10:03:00.000Z"
  }
]
```

### `categories.json`
Contains your custom categories and their order:
```json
[
  {
    "id": "produce",
    "name": "produce",
    "emoji": "🥬", 
    "order": 0,
    "isDefault": true
  }
]
```

## ⚡ How It Works

### 1. **Startup Loading**
- App tries to load JSON files first
- If files don't exist, falls back to localStorage
- Sample data is provided to get you started

### 2. **Runtime Changes**
- All changes are saved to localStorage immediately
- Updated JSON is logged to browser console
- Copy console output to update your JSON files

### 3. **Data Sync Workflow**
```
🔄 Make changes in app → 💾 Saved to localStorage → 
📝 Check console logs → ✂️ Copy JSON → 📄 Update files
```

## 🔧 Managing Your Data

### **View Console Logs**
1. Press `F12` to open Developer Tools
2. Go to "Console" tab  
3. Look for messages like "📄 Updated shopping items JSON:"
4. Copy the JSON output

### **Update JSON Files**
1. Open the relevant `.json` file in a text editor
2. Replace contents with the JSON from console
3. Save the file
4. Refresh the app to load updated data

### **Backup Your Data**
- JSON files are human-readable backups
- Version control with Git automatically
- Copy files to backup locations easily

### **Edit Data Manually**
You can edit the JSON files directly:
- Add new items
- Change categories
- Modify stock status
- Bulk updates

## 🚀 Benefits

### **✅ Portable**
- Take your data anywhere
- No database required
- Works offline completely

### **✅ Version Controlled**  
- Track changes with Git
- Sync across devices via GitHub
- See history of your grocery data

### **✅ Editable**
- Modify data in any text editor
- Bulk operations possible
- Import/export friendly

### **✅ Transparent**
- See exactly what's stored
- No hidden data
- Easy to understand format

## 🔄 Migration from localStorage

If you had data in the old localStorage-only version:

1. **Open the app** (data loads from localStorage)
2. **Check browser console** for JSON output
3. **Copy the JSON** for each data type
4. **Create/update** the `.json` files
5. **Refresh** to load from files

## 🛠️ Troubleshooting

**"Files not found" in console**
- Normal on first run
- App falls back to localStorage automatically
- Create JSON files using console output

**"Data not loading"**
- Check file names are exact: `shopping-items.json`, `pantry-items.json`, `categories.json`
- Ensure valid JSON format (use JSON validator)
- Check browser console for error details

**"Changes not persisting"**
- Changes save to localStorage automatically
- Use console output to update JSON files manually
- Files need manual sync from console logs

## 🎯 Pro Tips

- **Set up a simple script** to auto-copy console JSON to files
- **Use Git** to track changes to your grocery data over time  
- **Share JSON files** with family members for synchronized lists
- **Create category templates** for different stores by copying `categories.json`