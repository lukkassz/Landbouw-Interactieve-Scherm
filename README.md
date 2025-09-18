# Museum Landbouw Project
# Stack
React + Vite + TailwindCSS + PostCSS (?)

# Prerequisites
- nodejs (v22.19.0) met npm
- VSCode (ES7+ React/Redux/React-Native snippets, Tailwind CSS IntelliSense, Auto Rename Tag)
- Git or Git Desktop [guide](github_desktop_ssh_setup.md)



# Setup (Required only once)
1. Create a fork of this repository (Through github)
2. Clone your fork to your local machine
```bash
git clone git@github.com:{YOURNAME}/Landbouw-Interactieve-Scherm.git

cd Landbouw-Interactieve-Scherm

cd frontend/

npm install (Installs Tailwind etc)

npm run dev
```
# How to create a PR
1. Update your fork on GitHub
<img width="926" height="262" alt="image" src="https://github.com/user-attachments/assets/a5e95d68-d60b-482f-8fa1-7c8436b51935"/>

2. Update your local clone
```bash
git checkout master; git pull
```
3. Create a new branch
Always make sure you are on master branch before creating a new branch by typing:
```bash
 git checkout master
```
Create a new branch giving it a name befitting of the changes made/added.
```bash
git checkout -b remove-scrollbar
```
4. Add your changes
```bash
git add index.hmtl styles.css 
```
You can use the git status command to check which files have been selected to be committed

5. Commit & Push your changes
```bash
git commit -m "Remove scrollbar from index.html and add style.css"

git push --set-upstream origin remove-scrollbar
```
6. Open the PR
Go to the main repo https://github.com/Museumproject-Placeholder/Landbouw-Interactieve-Scherm/tree/main  you will notice that GitHub is smart enough to realize that you are about to open a PR and shows this nice box:
<img width="1039" height="499" alt="image" src="https://github.com/user-attachments/assets/f5bb5535-4dbd-4411-9d43-cb7cf70a28c4" />

Done I think : )
