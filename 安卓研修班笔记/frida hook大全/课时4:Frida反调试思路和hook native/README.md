# 用户代码 native hook
1. Frida反调试与反反调试基本思路(Java层API,Native层API,Syscall)
2. 六月题的Frida反调试的实现以及
3. Native函数的Java hook以及主动调用
4. 静态注册函数参数，返回值打印和替换

# 0x1 反调试
17种的so的反调试，同样适用于frida，另外三种的话是
1. 遍历连接手机所有端口发送`D-bus`消息，如果返回"REJECT"这个特征则认为存在frida-server
2. 直接调用`openat`的`syscall`的检测在`text`节表中搜索`frida-gadget*.so / frida-agent*.so`字符串，避免了`hook` `libc`来anti-anti的方法。
https://github.com/b-mueller/frida-detection-demo/blob/master/AntiFrida/app/src/main/cpp/native-lib.cpp
3. 内存中存在`frida rpc`字符串，认为有frida-server
https://github.com/qtfreet00/AntiFrida/blob/master/app/src/main/cpp/detect.cpp

第二种直接通过sycall来进行检测的话，就无法通过hook libc的api进行反反调试了，毕竟已经是从底层入手，用汇编sycall实现一个方法，反反调试的话，只能通过修改内核或者改硬编码了,
这里也给出手写汇编syscall方式反反调试，手写汇编调用syscall的方式，可以在内存(或so)里搜pattern，定位到具体的位置，将此处的调用patch掉。  
题外话：
不是手写汇编的方式，直接调用syscall检测frida特征。
想要anti这种反调试的话，可以：
1. 编译frida源码，所有地方改成frita；
2. 编译内核源码，hook openat 的syscall