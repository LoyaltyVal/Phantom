const fs = require('fs')
const path = require('node:path')
const lenguage = {}
let isLoad = false;

function loadLenguage() {
    // Cargar los archibos de la carpeta config

    const filesPath = path.join(__dirname, 'config')
    const files = fs.readdirSync(filesPath);
    files.forEach((file) => {
        const fileName = path.basename(file, path.extname(file))
        lenguage[fileName] = require(`./config/${file}`);
    });
    isLoad = true;
}



module.exports = {
    loadLenguage,
    getLenguage: (key) => {
        if (!isLoad) {
            loadLenguage();
        }
        if (!lenguage[key]) {
            return lenguage['en-EN'];
        }
        return lenguage[key];
    },
    setLenguage: (key, value) => {
        lenguage[key] = value;
        fs.writeFileSync('./config/lenguages.json', JSON.stringify(lenguage));
    },
    keysLenguage: () => {
        if (!isLoad) {
            loadLenguage();
        }
        return Object.keys(lenguage);
    }
}