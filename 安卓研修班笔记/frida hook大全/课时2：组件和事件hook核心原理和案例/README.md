# 组件和事件的hook核心原理和案例

0x01 构造方法的hook的例子（java.lang.String)
```
#构造方法的hook
Java.use("java.lang.String").$init.implementation=....
#构造方法的主动调用
Java.use("java.lang.String").$new("YenKoc")
```