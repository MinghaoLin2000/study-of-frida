# 组件和事件的hook核心原理和案例

0x01 构造方法的hook的例子（java.lang.String这个随便哪个类都行）
```
#构造方法的hook
Java.use("java.lang.String").$init.implementation=....
#构造方法的主动调用
Java.use("java.lang.String").$new("YenKoc")
```

0x02 显示类的方法和变量
上一节课使用的是wallbreaker这个插件，直接命令行就能输出，还可以找出对象以及类的信息，还可以搜索对象实例，根据objection的源码来看，其实也就是frida的一个枚举类的hook，然后封装起来的。frida本质操作对象还是对类为基本对象进行操作的。

0x03 组件hook
