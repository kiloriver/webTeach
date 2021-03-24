build:
    preinstall:node-gyp,windows-build-tools
    eg
        npm install -g node-gyp
        npm install --global --production windows-build-tools
    install:
        npm install
api:
    1 https://host:port/teacher?lesson=xxx
    2 https://host:port/student?lesson=xxx
