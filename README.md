OJ 题目排版工具。

功能演示：

![](https://github.com/1024th/vscode-OJ-format/assets/1.gif)

![](https://github.com/1024th/vscode-OJ-format/assets/2.gif)

推荐安装插件：[Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) 来显示 TeX 公式。

部分功能参考插件：[Pangu-Markdown](https://marketplace.visualstudio.com/items?itemName=xlthu.Pangu-Markdown)，深表感谢。

**本插件功能一览：**

编辑 markdown 文件时，右键菜单内包括指令“OJ 题目格式化”和“OJ 添加样例数据”

OJ 题目格式化：

1. **中英文之间添加空格。**
2. **在中文和 TeX 公式之间添加空格。**
3. **在常数两边添加`$`（转为 TeX 公式）。**
4. **在中文语境中的单个英语字母两边添加`$`（转为 TeX 公式）。**
5. **将`“”`替换为`「」`，将`‘’`替换为`『』`**（使用直角引号时，第一层使用单引号，第二层使用双引号）。
6. 中文和`[ ]`符号之间添加空格。
7.  将中文字符之后的`, \ . : ; ? ! `替换为`，、。：；？！`
8.  中文字符周围的`()`替换为`（）`
9.  `[] <> `保持不动。
10. 连续的句号`。`（最少 3 个）替换为省略号`......`。
11. 超过三个连续的`？ ！`符号替换为三个。
12. 连续的`。，；：、“”『』〖〗《》`符号替换为一个。
    
OJ 添加样例数据：

输入样例组数，选择是否添加样例提示，便可生成样例输入输出模板。

**内置 Snippets:** 

1. 关键字：`problem`，内容：

    ```plain
    # ${1:标题}
    
    ## 题目描述
    
    $2
    
    ## 输入格式
    
    $3
    
    ## 输出格式
    
    $4
    
    ## 样例
    
    $5
    
    ## 数据范围与提示
    
    $6
    ```

2. 关键字：`source`，内容：

        **Source: $1**

3. 关键字：`wk`，内容：

    ```plain
    「微课 $1.$2.$3 例 $4」$5
    ```
