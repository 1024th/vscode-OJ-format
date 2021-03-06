'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");

function activate(context) {
    console.log('Congratulations, your extension "AHSFNU-OJ-format" is now active!');

    let format = vscode.commands.registerCommand('OJ.format', () => {
        new DocumentFormatter().updateDocument();
    });
    let add_examples = vscode.commands.registerCommand('OJ.add_examples', () => {
        new add_example_data();
    });
    context.subscriptions.push(format);
    context.subscriptions.push(add_examples);
    context.subscriptions.push(vscode.commands.registerCommand('OJ.create_example_folder', (current_uri) => {
        new create_example_folder(current_uri);
    }));
    // context.subscriptions.push(new Watcher());
}
exports.activate = activate;

function deactivate() { }
exports.deactivate = deactivate;

class Config {
    constructor() {
        this._config = vscode.workspace.getConfiguration('OJ');
        this.single_letter = this._config.get("transformSingleLetterToTex");
        this.number = this._config.get("transformNumberToTex");
        this.add = this._config.get("texAddLeftAndRight");
    }
}
class DocumentFormatter {
    updateDocument() {
        let config = new Config;
        //console.log(config);
        //console.log(config.single_letter);
        //console.log(config.number);
        //console.log(config.add);
        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;
        // Only update status if an Markdown file
        if (doc.languageId === "markdown") {
            // 按照每行进行搞定
            vscode.window.activeTextEditor.edit((editorBuilder) => {
                let content = doc.getText(this.current_document_range(doc));
                // 全局替换
                content = this.condenseContent(content);
                //content = this.replaceFullNums(content);
                //content = this.replaceFullChars(content);
                // 每行操作
                let isCode = false;
                let isEquation = false;
                content = content.split("\n").map((line) => {
                    line = this.replacePunctuations(line);
                    // 判断是否为代码块
                    if (line.match(/^```/)) isCode = !isCode;
                    if (isCode) return line;
                    else {
                        if (line.match(/^\$\$.*?\$\$ *$/)) {
                            if (config.add) line = this.addLeftRight(line);
                        }
                        else {
                            if (line.match(/^\$\$ */)) isEquation = !isEquation;
                            if (config.add && isEquation) line = this.addLeftRight(line);
                        }
                    }
                    // 中英文、中文与公式之间加空格
                    line = line.replace(/([\u4e00-\u9fa5\u3040-\u30FF])([a-zA-Z0-9\[\(\$])/g, '$1 $2');
                    line = line.replace(/([a-zA-Z0-9\]!;\,\.\:\?\)\$])([\u4e00-\u9fa5\u3040-\u30FF])/g, "$1 $2");
                    line = line.replace(/\[([^\]]+)\][（(]([^)]+)[）)]/g, "[$1]($2)");
                    // “”替换为「」, ‘’替换为『』
                    line = line.replace("“", "「");
                    line = line.replace("”", "」");
                    line = line.replace("‘", "『");
                    line = line.replace("’", "』");
                    // 在小代码块(`code`)之外替换中文语境中的数字和单个字母为TeX公式
                    if (config.single_letter) {
                        line = this.notIn(line, "`", this.singleLetterToTeX);
                    }
                    if (config.number) {
                        line = this.notIn(line, "`", this.numberToTeX);
                    }
                    // TeX公式括号两边补全\left和\right
                    if (config.add) {
                        line = this.notIn(line, "`", (content) => this.isIn(content, /(?<!\$)\$(?!\$)/g, this.addLeftRight, "$"));
                    }
                    return line;
                }).join("\n");
                editorBuilder.replace(this.current_document_range(doc), content);
            });
        }
        else {
        }
    }
    current_document_range(doc) {
        let start = new vscode.Position(0, 0);
        let end = new vscode.Position(doc.lineCount - 1, doc.lineAt(doc.lineCount - 1).text.length);
        let range = new vscode.Range(start, end);
        return range;
    }
    condenseContent(content) { //去除连续空行
        content = content.replace(/^(.*)(\r?\n\1)+$/gm, "$1");
        return content;
    }
    // 对被split_by包围的文本执行replaceMethod，并返回修改后的content
    // e.g. split_by=="$"，就是在公式内执行replaceMethod
    isIn(content, split_by, replaceMethod, join_by, reverse = false) {
        if (!join_by) { join_by = split_by; }
        let inside = true; // 判断是否在keyword所包围的文本内
        content = content.split(split_by).map((block) => {
            inside = !inside;
            if (reverse ? (!inside) : inside) {
                block = replaceMethod(block);
            }
            return block;
        }).join(join_by);
        return content;
    }
    // 对不被split_by包围的文本执行replaceMethod，并返回修改后的content
    // e.g. split_by=="`"，就是在代码块外执行replaceMethod
    notIn(content, split_by, replaceMethod, join_by) {
        if (!join_by) { join_by = split_by; }
        return this.isIn(content, split_by, replaceMethod, join_by, true);
    }
    addLeftRight(content) { // TeX公式括号两边补全\left和\right
        content = content.replace(/(?<!\\left *)(\(|\[|\\\{)/g, "\\left$1");
        content = content.replace(/(?<!\\right *)(\)|\]|\\\})/g, "\\right$1");
        return content;
    }
    singleLetterToTeX(content) {
        // 中文语境中的单个字母替换为TeX公式
        content = content.replace(/(?<=[\u4e00-\u9fa5] )([a-zA-Z])(?= [\u4e00-\u9fa5])/g, "$$$1$$");
        content = content.replace(/(?<=[\u4e00-\u9fa5] )([a-zA-Z])(?=[。，？！；：、「」『』〖〗【】《》（）])/g, "$$$1$$");
        content = content.replace(/(?<=[。，？！；：、「」『』〖〗【】《》（）] ?)([a-zA-Z])(?= [\u4e00-\u9fa5])/g, "$$$1$$");
        content = content.replace(/^([a-zA-Z])(?= [\u4e00-\u9fa5])/g, "$$$1$$");
        return content;
    }
    numberToTeX(content) {
        // 中文语境中的数字替换为TeX公式
        content = content.replace(/(?<=[\u4e00-\u9fa5] )([0-9]+)(?= [\u4e00-\u9fa5])/g, "$$$1$$");
        content = content.replace(/(?<=[\u4e00-\u9fa5] )([0-9]+)(?=[。，？！；：、「」『』〖〗【】《》（）])/g, "$$$1$$");
        content = content.replace(/(?<=[。，？！；：、「」『』〖〗【】《》（）] ?)([0-9]+)(?= [\u4e00-\u9fa5])/g, "$$$1$$");
        content = content.replace(/^([0-9]+])(?= [\u4e00-\u9fa5])/g, "$$$1$$");
        return content;
    }
    replacePunctuations(content) { // 替换中文字符之后的英文标点符号为中文标点符号
        content = content.replace(/([\u4e00-\u9fa5\u3040-\u30FF])\.($|\s*)/g, '$1。');
        content = content.replace(/([\u4e00-\u9fa5\u3040-\u30FF]),\s*/g, '$1，');
        content = content.replace(/([\u4e00-\u9fa5\u3040-\u30FF]);\s*/g, '$1；');
        content = content.replace(/([\u4e00-\u9fa5\u3040-\u30FF])!\s*/g, '$1！');
        content = content.replace(/([\u4e00-\u9fa5\u3040-\u30FF]):\s*/g, '$1：');
        content = content.replace(/([\u4e00-\u9fa5\u3040-\u30FF])\?\s*/g, '$1？');
        content = content.replace(/([\u4e00-\u9fa5\u3040-\u30FF])\\\s*/g, '$1、');
        content = content.replace(/\(([\u4e00-\u9fa5\u3040-\u30FF])/g, '（$1');
        content = content.replace(/([\u4e00-\u9fa5\u3040-\u30FF])\)/g, '$1）');
        content = content.replace(/。\{3,}/g, '......');
        content = content.replace(/([！？])$1{3,}/g, '$1$1$1');
        content = content.replace(/([。，；：、“”『』〖〗《》])\1{1,}/g, '$1');
        return content;
    }
    replaceFullNums(content) {
        " 全角数字。";
        content = content.replace("０", "0");
        content = content.replace("１", "1");
        content = content.replace("２", "2");
        content = content.replace("３", "3");
        content = content.replace("４", "4");
        content = content.replace("５", "5");
        content = content.replace("６", "6");
        content = content.replace("７", "7");
        content = content.replace("８", "8");
        content = content.replace("９", "9");
        return content;
    }
    replaceFullChars(content) {
        " 全角英文和标点。";
        content = content.replace("Ａ", "A");
        content = content.replace("Ｂ", "B");
        content = content.replace("Ｃ", "C");
        content = content.replace("Ｄ", "D");
        content = content.replace("Ｅ", "E");
        content = content.replace("Ｆ", "F");
        content = content.replace("Ｇ", "G");
        content = content.replace("Ｈ", "H");
        content = content.replace("Ｉ", "I");
        content = content.replace("Ｊ", "J");
        content = content.replace("Ｋ", "K");
        content = content.replace("Ｌ", "L");
        content = content.replace("Ｍ", "M");
        content = content.replace("Ｎ", "N");
        content = content.replace("Ｏ", "O");
        content = content.replace("Ｐ", "P");
        content = content.replace("Ｑ", "Q");
        content = content.replace("Ｒ", "R");
        content = content.replace("Ｓ", "S");
        content = content.replace("Ｔ", "T");
        content = content.replace("Ｕ", "U");
        content = content.replace("Ｖ", "V");
        content = content.replace("Ｗ", "W");
        content = content.replace("Ｘ", "X");
        content = content.replace("Ｙ", "Y");
        content = content.replace("Ｚ", "Z");
        content = content.replace("ａ", "a");
        content = content.replace("ｂ", "b");
        content = content.replace("ｃ", "c");
        content = content.replace("ｄ", "d");
        content = content.replace("ｅ", "e");
        content = content.replace("ｆ", "f");
        content = content.replace("ｇ", "g");
        content = content.replace("ｈ", "h");
        content = content.replace("ｉ", "i");
        content = content.replace("ｊ", "j");
        content = content.replace("ｋ", "k");
        content = content.replace("ｌ", "l");
        content = content.replace("ｍ", "m");
        content = content.replace("ｎ", "n");
        content = content.replace("ｏ", "o");
        content = content.replace("ｐ", "p");
        content = content.replace("ｑ", "q");
        content = content.replace("ｒ", "r");
        content = content.replace("ｓ", "s");
        content = content.replace("ｔ", "t");
        content = content.replace("ｕ", "u");
        content = content.replace("ｖ", "v");
        content = content.replace("ｗ", "w");
        content = content.replace("ｘ", "x");
        content = content.replace("ｙ", "y");
        content = content.replace("ｚ", "z");
        content = content.replace("＠", "@");
        return content;
    }
}
// class Watcher {
//     getConfig() {
//         this._config = vscode.workspace.getConfiguration('OJ');
//     }
//     constructor() {
//         this.getConfig();
//         if (this._config.get('auto_format_on_save', false)) {
//             let subscriptions = [];
//             this._disposable = vscode.Disposable.from(...subscriptions);
//             vscode.workspace.onWillSaveTextDocument(this._onWillSaveDoc, this, subscriptions);
//         }
//     }
//     dispose() {
//         this._disposable.dispose();
//     }
//     _onWillSaveDoc(e) {
//         new DocumentFormatter().updateDocument();
//     }
// }
// # sourceMappingURL=extension.js.map
function add_example_data() {
    vscode.window.showInputBox(
        { // 这个对象中所有参数都是可选参数
            password: false, // 输入内容是否是密码
            ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            placeHolder: '输入一个正整数', // 在输入框内的提示信息
            prompt: '样例数据组数？', // 在输入框下方的提示信息
            validateInput: function (text) {
                // if (text == "0") return text;
                var patrn = /^[1-9]\d*$/;
                if (!patrn.exec(text)) return "格式不符";
            } // 对输入进行验证并返回错误提示
        }).then(function (num) {
            vscode.window.showQuickPick(
                [
                    "是",
                    "否"
                ],
                {
                    canPickMany: false,
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: '是否添加样例说明？'
                })
                .then(function (msg) {
                    let editor = vscode.window.activeTextEditor;
                    let snippet = "";
                    if (num == 1) {
                        snippet = "__样例输入__\n\n```plain\n$1\n```\n\n" +
                            "__样例输出__\n\n```plain\n$2\n```\n\n";
                        if (msg == "是") snippet += "__样例说明__\n\n$3";
                    } else {
                        let cnt = 1;
                        for (let i = 1; i <= Number(num); i++) {
                            snippet +=
                                "__样例输入 " + i + "__\n\n```plain\n\${" + (cnt++) + "}\n```\n\n" +
                                "__样例输出 " + i + "__\n\n```plain\n\${" + (cnt++) + "}\n```\n\n";
                            if (msg == "是") snippet += "__样例说明 " + i + "__\n\n```plain\n\${" + (cnt++) + "}\n```\n\n";
                        }
                    }
                    editor.insertSnippet(vscode.SnippetString(snippet));
                })
        });
}

const fs = require("fs");
const path = require("path");

function create_folder(basePath, included_folders, included_files) {
    fs.mkdir(basePath, (err) => {
        if (err) {
            if (err.message.startsWith("EEXIST: file already exists, mkdir")) {
                vscode.window.showWarningMessage("文件夹 “" + path.basename(basePath) + "” 已存在！");
            } else {
                vscode.window.showErrorMessage(err.message);
            }
            throw err;
        } else {
            for (let i = 0; i < included_files.length; ++i) {
                let file_path = path.join(basePath, included_files[i]);
                // console.log(file_path)
                fs.writeFile(file_path, "", { "flag": "a" }, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage(err.message);
                        throw err;
                    }
                    // console.log('The file has been saved!');
                });
            }
            for (let i = 0; i < included_folders.length; ++i) {
                let folder_path = path.join(basePath, included_folders[i]);
                fs.mkdir(folder_path, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage(err.message);
                        throw err;
                    }
                })
            }
        }
    })
}

function create_example_folder(current_uri) {
    // console.log(current_uri)
    // const basePath = current_uri.fsPath.replace(/\\/g, "/");
    const basePath = current_uri.fsPath;
    let get_title = basePath.match(/微课 [0-9]\.[0-9]\.[0-9]/g);
    // console.log(get_title)
    if (get_title) get_title = get_title[get_title.length - 1];
    else get_title = '微课 x.x.x'
    vscode.window.showInputBox(
        {
            password: false, // 输入内容是否是密码
            ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            prompt: '输入微课编号', // 在输入框下方的提示信息
            value: get_title
        }).then(function (title) {
            vscode.window.showInputBox(
                {
                    password: false, // 输入内容是否是密码
                    ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    placeHolder: '输入一个正整数', // 在输入框内的提示信息
                    prompt: '例题个数？', // 在输入框下方的提示信息
                    validateInput: function (text) {
                        // if (text == "0") return text;
                        var patrn = /^[1-9]\d*$/;
                        if (!patrn.exec(text)) return "格式不符";
                    } // 对输入进行验证并返回错误提示
                }).then(function (num) {
                    num = Number(num);
                    let files = ["题面.md", "题解.md", "std.cpp"];
                    let folders = ["数据"];
                    for (let i = 1; i <= num; ++i) {
                        let new_folder = path.join(basePath, "/「" + title + " 例 " + String(i) + "」x");
                        create_folder(new_folder, folders, files);
                    }
                });
        });
}