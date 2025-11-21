# 🎮 Arcade Manager : Gestion de Collection de Jeux Vidéo 

Ce projet est une application web permettant de gérer une bibliothèque de jeux vidéo.

<img width="3071" height="1791" alt="image" src="https://github.com/user-attachments/assets/7fe57ec5-e5eb-4097-b9ee-209832ec8399" />


## 📁 Structure du projet

* **`backend/`** : API Serveur (Node.js, Express, MongoDB) - Port **5000**
* **`jeux-front/`** : UI (React, TypeScript, Tailwind) - Port **5173**

---

## 🛠️ 1. Pré-requis : Base de Données MongoDB

Avant de lancer le code, assurez-vous que **MongoDB** est lancé et que l'utilisateur **Root** est configuré.

1.  Ouvrez un terminal et lancez le shell MongoDB :
    ```powershell
    mongosh
    ```
2.  Créez l'utilisateur administrateur (copiez-collez ce bloc) :
    ```javascript
    use admin
    db.dropUser("nosql") // Au cas où il existe déjà
    db.createUser({
      user: "nosql",
      pwd: "nosql",
      roles: [ { role: "root", db: "admin" } ]
    })
    exit
    ```

---

## 🚀 2. Installation & Lancement du Backend

Ce terminal doit rester ouvert pour que l'API fonctionne.

1.  Ouvrez un terminal et allez dans le dossier backend :
    ```bash
    cd backend
    ```

2.  Installez les dépendances (si première fois) :
    ```bash
    npm install
    ```

3.  Lancez le serveur :
    ```bash
    node server.js
    ```

✅ **Succès :** Vous devez voir le message :
> `✅ Connecté à MongoDB`
> `🚀 Serveur running on port 5000`

---

## 🖥️ 3. Installation & Lancement du Frontend

1.  Ouvrez un **nouveau terminal** et allez dans le dossier frontend :
    ```bash
    cd jeux-front
    ```

2.  Installez les dépendances (si première fois) :
    ```bash
    npm install
    ```

3.  Lancez le mode développement :
    ```bash
    npm run dev
    ```

✅ **Succès :** Vite va vous donner une URL (généralement `http://localhost:5173`).
Ouvrez ce lien dans votre navigateur pour utiliser l'application.

---

## 🆘 Dépannage Rapide

### 🔴 Erreur : `Command insert requires authentication`
* **Cause :** L'utilisateur `nosql` n'a pas les droits ou n'existe pas.
* **Solution :** Refaites l'étape 1 (création user root via `mongosh`).
* **Vérification :** Dans `backend/server.js`, l'URI doit être :
    `mongodb://nosql:nosql@localhost:27017/game_collection_db?authSource=admin`

### 🔴 Erreur : `Authentication failed`
* **Cause :** Le mot de passe dans `server.js` ne correspond pas à celui dans la base.
* **Solution :** Assurez-vous d'avoir mis `nosql` comme mot de passe partout.

### 🔴 Frontend : Erreur rouge "Serveur indisponible"
* **Cause :** Le backend ne tourne pas.
* **Solution :** Vérifiez que le terminal du backend est bien ouvert et n'a pas planté.

