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
这里也是按objection的源码去理解，在看视频的途中，我也发现了其实写frida hook其实也就是调用系统的api，最终还是写开发的代码，只不过平常我们写java开发是直接调用现成的一些系统jar，frida的话，是通过hook的方式操作。

objection中如何通过android intent lanuch_activity xxx.mainActivity启动活动（界面）
还给出了个打印intent信息的脚本
```
Java.perform(function(){
    var Activity=Java.use("android.app.Activity");
    Activity.startActivity.overload("android.content.Intent").implementation=function(p)
    {
        console.log("Hooking android.app.Activity.startActivity(p1) successfully,p1="+p1);
        console.log(decodeURIComponent(p1.toUri(256)));
        this.startActivity(p1);
    }
     Activity.startActivity.overload("android.content.Intent","android.os.Bundle").implementation=function(p1,p2)
    {
        console.log("Hooking android.app.Activity.startActivity(p1,p2) successfully,p1="+p1,",p2="+p2);
        console.log(decodeURIComponent(p1.toUri(256)));
        this.startActivity(p1);
    }
    Activity.startService.overload("android.content.Intent").implementation=function(p1){
        console.log("Hooking android.app.Activity.startService(p1) successful.p1="+p1);
        console.log(decodeURIComponent(p1.toUri(256)));
        this.startService(p1);
    }
})
```
