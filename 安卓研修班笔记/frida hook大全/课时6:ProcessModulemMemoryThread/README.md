# 用户代码 native hook
1. process
2. Module
3. Memory
4. Thread
# process 
这部分其实就是在查看frida的process api  
https://frida.re/docs/javascript-api/#process
里面的api，都可以在载入frida脚本后，在命令行直接运行
1. 注意点在于枚举出所有的导出函数和符号表时，出现了一个问题，就是符号表中无东西，但是导出函数却有，以往认知都认为符号表是个全集，导出是包含的关系，但是ndk在编译so文件时，strip（）了符号表，所有有可能就没有东西，但是导出表是有的，一般也只是用导出表就够了
2. 可以在内存中暴力搜索opcode或者dump出dex的方式，都是可以通过frida的匹配方式去做