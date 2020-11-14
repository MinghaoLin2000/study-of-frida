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
接下来是讲解如何去hook，按钮点击时间的onClick方法的hook，这样可以打印出对应的类名，肉丝说一般的开发都不可能是使用直接实现ViewOnClick这个接口，创建匿名类的手法，这样很乱，我直接踩雷，好像平时也都是这样去写，可能是控件还不够多2333.
这里挂一下hook 打印出onClick方法的类的类名
```
function watch(obj,mtdName)
{
    var listener_name=getObjClassName(obj);
    var target=Java.use(listener_name);
    if(!target||!mtdName in target)
    {
        return;
    }
    target[mtdName].overloads.forEach(function(overload){
        overload.implementation=function(){
            console.log("[WatchEvent]"+mtdName+":"+getObjClassName(this));
            return this[mtdName].apply(this.argument);
        }

    })
}
function OnClickListener()
{
    Java.perform(function(){
        #以spawn的模式自启动的hook
        Java.use("android.view.View").setOnClickListener.implementation=function(listener){
            if(listener!=null)
            {
                watch(listener,"onClick);
            }
            return this.setOnClickListener(listener);
        };
         #attach模式去附加进程的hook，就是更慢的hook，需要看hook的时机，hook一些已有的东西
        Java.choose("android.view.ViewListenerInfo",{
            onMatch:function(instance){
                instance=instance.mOnClickListener.value;
                if(instance)
                {
                    console.log("instance name is"+getObjClassName(instance));
                    watch(instance,"onClick);
                }
            },
            onComplete:function(){

            }
        })

    })
}
watch这个函数，相等于是将实现点击接口类的所有onClick方法重载都hook了，只要调用这个方法就会打印出该类的名字
