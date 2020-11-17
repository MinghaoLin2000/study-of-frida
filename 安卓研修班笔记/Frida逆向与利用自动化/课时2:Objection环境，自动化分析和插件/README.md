# Frida简介
1. objection与frida版本匹配安装
2. objection连接非标准端口
3. objection内存漫游,hook,trace
4. objection插件体系:Wallbreaker
5. objection + DEXDump脱壳

# 0x01 objection安装
objection安装是使用pip install来进行安装，一般是与frida的版本来匹配的具体操作流程挂个肉丝的
星球，里面介绍的非常详细
https://wx.zsxq.com/dweb2/index/search/%E7%89%B9%E5%AE%9A%E7%89%88%E6%9C%AC
pip install objection==xxx(版本号)
如果没加版本号，会直接安装新的
这里插一嘴，pyenv这玩意管理python环境是真的香，这里记录几个pyenv的命令
1. pyenv versions 查看管理的所有python的版本
2. pyenv local xxx(python的版本) 切换python版本
切换完后面再pip！
# 0x02 Objection的使用

一. 从objection --help里面扒出来的
```
Options:
  -N, --network            Connect using a network connection instead of USB.
                           [default: False]

  -h, --host TEXT          [default: 127.0.0.1]
  -p, --port INTEGER       [default: 27042]
  -ah, --api-host TEXT     [default: 127.0.0.1]
  -ap, --api-port INTEGER  [default: 8888]
  -g, --gadget TEXT        Name of the Frida Gadget/Process to connect to.
                           [default: Gadget]

  -S, --serial TEXT        A device serial to connect to.
  -d, --debug              Enable debug mode with verbose output. (Includes
                           agent source map in stack traces)

  --help                   Show this message and exit.
```
objecton可以选择两种连接方式，一种usb连接，一种是无线连接
1. usb连接: objection -g 包名 explore
2. 无线连接: objection -N -h xx(ip地址) -p xx(frida运行的非标准端口号) -g 包名 explore
frida运行非标准端口:./frida_server -l 0.0.0.0:xxx(非标准端口号)

* 以下操作(都在objection中进行）  
二. 搜加载的so库文件
memory list modules
三. 查看库的导出函数
memory list exports xxx.so
* 有时候数据很难找时，可以去查看objection的日志进行查找.  
在kali中的命令行执行cat .objection/objection.log | grep i xxx(要查找内容的关键字)  

四. 在内存堆中搜索与执行
查看堆中的对象:android heap search instances xxx.xxx.xxx.类名  
调用方法: android heap execute 堆地址 方法名  

五.在实例上执行js代码
先输入android heap evaluate 堆地址，会弹出一个窗口，输入js代码  
如console.log("evaluate result"+clazz.getPreferenceScreenResId())
输入完后，按esc，回车自动执行该js代码  

六.启动activity或者service
　android intent lauch_activity 包名.活动名
做法是先查找activity有哪些
android hooking list activities  
然后再启动我们想要启动的活动

内存漫游  
其实frida hook本质操作对象是类，所以我们的hook入手点就是找到要hook的类
然后再找到我们要hook的方法，以及方法的参数与返回值，objection也帮我们搞好了  

七.查找类以及类中方法  
android hooking list class  
方法  
android hooking list class_method 类名  
八.使用objection去hook类中的所有方法  
android hooking watch class 包名.类名  

使用jobs list可以查看hook数以及hook了哪个类  
如果对特定的方法进行hook，并打印出参数和返回值调用栈    
* android hooking watch class_method android.bluetooth.BluetoothDevice.getName --dump-args --dump-return --dump-backtrace  

九.hook 方法的重载
以hook 构造方法为例
android hooking watch class_method 包名.类名.$init --dump-args





