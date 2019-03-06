# lottie schema

基于vscode的 json schema https://lottie-lint.github.io/lottie-schema/animation.json

对lottie json 进行解析

schema关系 大图:https://www.processon.com/view/link/5c2ece6ae4b08a768398b06d

## how to run


```bash
npm install
# 打包
npm run build
# 发布 json schema
npm run deploy
```

```js
export default class LottieSchema {
    private lottieJSON;
    constructor(options?: any);
    getJSON(): string;
    getObj(): any;
    getVersion(): any;
    getSize(): {
        ip: any;
        op: any;
        width: any;
        height: any;
    };
    setSize({ width, height, }: {
        width: string;
        height: string;
    }): void;
    addBgImage({ url, width, height, }: {
        url: string;
        width: number;
        height: number;
    }): void;
    checkBgImageExist(): false | {
        bgAssetIdx: any;
        bgLayerIdx: any;
    };
    changeBgImage({ size, position, }: {
        size: any | undefined;
        position: any | undefined;
    }): void;
}

```