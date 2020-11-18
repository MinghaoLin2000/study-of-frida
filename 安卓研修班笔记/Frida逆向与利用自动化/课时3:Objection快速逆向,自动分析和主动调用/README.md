# Objection快速逆向，自动分析和主动调用
1. 仿微信数据库逆向分析案例
2. 基本静态分析:jadx,010
3. 模拟器运行frida-server-x86
4. 静态分析，开发的视角，动态溯源
5. objection trace & hook & stack

# 0x01 从一个ctf案例入手
1. 题目先给出了一个之前在xctf写的安卓题，首先给出了一个ab后缀的文件，file一下，发现是安卓的备份文件，需要使用ade-all.jar提取出来  
android-back-extractor这玩意，github上直接下载，然后使用语法java -jar abe-all.jar unpack xxx.ab xxx.tar,提取出了两个文件夹，两个文件，分别是a,db,Encrypto.db,_manifest
2. 这题是运行在安卓4，5的系统上，所以得开模拟器，来弄，模拟器上安装个wifiadb，桥接！！！这个非常重要，不然adb不上，然后把x86的frida-server放进去，就可以愉快的开始操作了，
3. 发现其中的逻辑是先创建一个数据库，然后把输入名字和password经过一个函数加密后，插入表中，这里只要hook那个加密函数就好了233，objection的spawn和attach和frida差不多，毕竟objection就是frida的封装，objection启动时，会先查看进程是否启动，没启动的就spawn，如果启动就attach，至于hook 启动加载函数，得用这个  
objection -g packageName explore --startup-command 'android hooking watch xxx'
无敌了，很稳
4. 关键hook net.sqlipher.sqldatabase.getWriteDatabase这个方法就可以直接hook到参数，就是这个数据库的密钥，感觉开发太重要了，不懂开发对这个数据库还是挺懵的，百度搜了以下才知道，然后有DB Brower for SQLite这个工具可以打开那个数据库，输入我们之前hook的密码，输入进去，看表里面的flag就完事了
