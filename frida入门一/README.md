## 以下的脚本和案例都是参照肉丝师傅的github上的文章的，文章是夹杂我个人的理解来写的，也算是一种学习了。
---
# 一.Frida脚本的概率并实现一个简单的hello-world
## frida脚本概念
本质就是一个插桩框架，可以对内存空间对象方法进行监视，修改或者替换的一段代码
## 简单的hello world
编个hello-world.js，2333
```
setTimeout(function(){
    Java.perform(function()
    {
        console.log("hello world!");
    });
});
```
这段setTimeout()函数传入了一个匿名函数，匿名函数中又调用了Java.perform()函数
又传入了一个匿名函数，里面是实际要做的事，打印了一句话hello world！，setTimeout()方法将我们传入的匿名函数注册到js运行时去，毕竟本质还是js代码，然后Java.perform()方法将传入该方法的匿名函数注册到frida的java运行时中，用来执行函数操作，这里我也有点不理解，有点官方，我理解这个函数就是实际写代码的地方
然后在kali中，把adb devices，然后shell进去，把frida-server打开
再另外开一个终端，frida -U -l hello-world.js android.process.media
发现就打印出字符串了，
插一句：
这里肉丝表哥感觉写的模糊了一些，然后和之前一篇形式也不太一样，
frida -help打开之后，查看了这两个参数，一个是-U,一个是-l，也就是第一个是usb连接，第二个是指的load script，加载脚本，相当于这句话，把这段js代码，注入到了android.process.media这个进程中了。上一篇是用python来加载到，没想到还可以直接注入，666

## 二.简单脚本：枚举所有类
用到Java对象的enumerateLoadedClasses方法
重新创建一个js文件叫enumerateLoaderClasses.js
```
setTimeout(function(){
    Java.perform(function(){
        console.log("\n[*] enumerating classes");
        Java.enumerateLoadedClasses({
            onMatch:function(_className){
                console.log("[*] found instance of "+_className+"");
            },
            onComplete:function(){
                console.log("[*] class enumeration complete");

            }
        });
    });
});
```
frida -U -l hello-world.js android.process.media

## 三.简单脚本二：定位目标类并打印类实例
比如这里是查看蓝牙的类，所以先找bluetooth的类
```
setTimeout(function(){
    Java.perform(function(){
        console.log("\n[*] enumerating classes");
        Java.enumerateLoadedClasses({
            onMatch:function(instance){
                if(instance.split(".")[1]=="bluetooth"){
                    console.log("[->]\t"+instance)
                }
            },
            onComplete:function(){
                console.log("[*] class enumeration complete");

            }
        });
    });
});
```
再次输入上面的命令，将脚本注入进程中后，发现找到了很多蓝牙的类，然后定位到我们想要找到
的类后，就可以打印类的实际例子，使用Java.choose()函数，来选定一个实例
 ### 打印实例
 ```
 Java.choose("android.bluetooth.BluetoothDevice",{
            onMatch:function(instance){
                console.log("[*] "+" android.bluetooth.BluetoothDevie instance found"+" :=> '"+instance+"'");
                bluetoothDeviceInfo(instance);
            },
            onComplete:function(){
                console.log("[*] -------");
            }
        });
```
打开蓝牙，连接airpods，检测出蓝牙设备了。
## 三.定位到类之后，需要去定位对应到方法，并打印出来
这里使用到Java.use(),而不是Java.choose()，前者是新建一个对象，后者是选择内存空间已存在到实例
```function enumMethods(targetClass)
{
    var hook=Java.use(targetClass);
    var ownMethods=hook.class.getDeclareMethods();
    hook.$dispose;
    return ownMethods;
}

setTimeout(function(){
    Java.perform(function(){
        console.log("\n[*] enumerating classes");
        Java.enumerateLoadedClasses({
            onMatch:function(instance){
                if(instance.split(".")[1]=="bluetooth"){
                    console.log("[->]\t"+instance)
                }
            },
            onComplete:function(){
                console.log("[*] class enumeration complete");

            }
        });
        var a=enumMethods("android.bluetooth.BluetoothDevice");
        a.foreach(function(s){
            console.log(s);
        });
    });
});
```
这里可以把类到所有方法全部都打印出来，打印出来后，其实hook不就方便了，所以其实先要做的事，是定位到类，确定类到名字，通过类到名字，再次调用，java的use方法，新建一个对象，
然后再把所有方法枚举出来，再次找到要hook到方法名，就可以直接hook就完事了，当然这是不知道方法和类时候做法。
