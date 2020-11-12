0x01 系统框架java hook
___
1. frida对应的java语法指南
2. frida与java共同的一等公民:类
3. 找到/添加类的几种方法:内存漫游，动态加载，frida加载
4. 类变量，类方法；实例变量，实例方法;构造方法；hook和主动调用;
5. objection源码解析

前面讲思想比较多，主要还是说一些对抗上的思考，毕竟现在的vmp商业上满天飞，给静态和动态分析造成很大的阻碍，对抗的深度就得更深，ctf和实际app的分析，我个人觉得本质都是去找关键的代码或者点，ctf中可能是啥关键算法，实际app可能我们要去做的就是去hook某个关键的类，把一些信息给自吐出来
穿插了一些之前讲过的frida打印object对象时遇到gson包重名的问题，这里就是frida可以有api动态加载dex中的class文件，然后再选中一波，具体的就放个链接，基本就是打开dex文件，然后加载dex中的class文件。
https://bbs.pediy.com/thread-259186.htm

0x02 java知识理解
1. 多线程的东西，frida之前也是讲过可以，在frida中直接实现这个接口，确实和老师讲的一样，frida和java非常类似，同时这个异步线程中，也是运行在jvm中。
2. java的基础我还是算蛮扎实的，毕竟以前就是java开发2333，所以这段，我就蛮听听了，然后就是使用了objection中的wallbreaker这个插件，把类的信息都打印出来，
操作流程: 
1. 先将frida-server开启，然后如果是用usb连接，直接在命令行中输入objection -g 包名 explore -P plugin的路径(-P后面可有可无，后期可以使用plugin load 插件路径加载插件，效果一样),
2. 然后进入objection的界面后，加载wallbreaker的插件，就用上文的命令，加载之后，如果在打印类信息在objection界面的命令行中，输入plugin wallbreaker classdump -fullname 类的包名(xxx.xxx.xxx)