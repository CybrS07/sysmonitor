### System Monitoring system

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started
Before execution the program following instructions inorder to make the program works
# 1. NPM Prerequisite
Install dependencies
   ```bash
   npm install
   ```

## 2. Python Script prerequisite 
Install following libraries before running the script
```bash
pip install os psutil GPUtil time firebase_admin platform subprocess socket
```

## 3. Structure
The structure of the file are given below and the once mark as ** edit for changes ** these are the file that can be chage for customized the application
```
----.claude
|---.expo
|---.vscode
|--- assets
|--- script
|--- src
      |--- app
            |--- _layout.tsx   <====[ edits for changes ]
            |--- index.tsx     <====[ edits for changes ]
      |--- components
            |--- app-tabs.tsx  <====[ edit for changes ]
|--- .ignore.git <=====[ edit for changes ]
|--- AGENTS.md
|--- app.json
|--- CLAUDE.md
|--- monitor.py  <====[ edit for changes ]
```

## 4. Working
1. Make a account in the (Firebase)[https://console.firebase.google.com] and maek and account
2. Create a new project
3. After making the project, set up real-time database by going to **Database & storage > Realtime Database**.
4. The fir got to rules and change chenge the to the following.
```bash
{
  "rules": {
    ".read": false,
    ".write": false,
    "data": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```
5. Then in the same menu goto Data and copy the link, starts with ** https://(projectname)-------.app**, copy in add then in to the **monitor.py** and **app-tab.tsx** as give in the coment in the files.
6. Now after that inthe same project on th top left corner goto **setting > service account**, there in the **firebase admin sdk**, click on **generate new private key**.
7. After **step 6**, it will download a **.json** file. Just copy it and move it the the main project folder adn add the relative path in the monitor .py file as in comment given in the files.

## 5. Execution
Once you are done do the folloing steps
1. run the python Script **monitor.py**
2. Start the app by
   ```bash
   npm start
   ```
   If it dont work tyou first have to **cd** it intothe folder where all the files are and then execute it.
   
*Notice:* Make sure you have an virtual environment set before you run it as I might cause you an error.
In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Joint my on
<div align="left">

- <a href="https://youtube.com/@CybrS07"><img src="https://www.readmecodegen.com/api/social-icon?name=youtube&size=16&color=%23ef4444" alt="YouTube" /></a> [YouTube](https://youtube.com/@CybrS07)
- <a href="https://www.linkedin.com/in/muhammad-taharajputra"><img src="https://www.readmecodegen.com/api/social-icon?name=linkedin&size=16" alt="LinkedIn" /></a> [LinkedIn](https://www.linkedin.com/in/muhammad-taharajputra)

</div>
