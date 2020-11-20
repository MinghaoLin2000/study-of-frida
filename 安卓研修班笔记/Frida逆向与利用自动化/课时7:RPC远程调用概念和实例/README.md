# RPC远程调用概念和实例
1. 一定要注意顺序，先hook，然后invoke，再rpc
2. 逆向三段: 第三段RPC:Remote Procedure Call 远程调用
3. FRIDA精髓:远程调动
4. frida(rpc)多主机多手机多端口混连
5. frida精髓：互联互通
6. frida精髓：动态修改
7. child-gating,上传P到C打印

# 0x01 RPC概念以及演示
1. 概念  
百度上的概念，rpc，远程过程调用，是一个节点向另一个节点请求提供服务
我的理解其实就是类似客户端向服务器发送一个请求，服务器那边有对应的接口，接受请求后，提供对应的服务，然后把结果返回客户端.  

2. 演示
这里还是使用lesson4one的那个app作为讲解，这样实际操作之后我对这个rpc有了更深理解，感受到思路的精妙，太强了，先放代码，首先创建了一个lesson7lesson4.js文件，里面的js代码是这样的:  
```

function invoke()
{
    Java.perform(function(){
        Java.choose("com.example.lesson4one.MainActivity",{
            onMatch:function(instance){
                console.log("found instance",instance);
                console.log("found instance:",instance.secret());
            },onComplete:function(){}
        })
    })
}
//setTimeout(voke,2000)

rpc.exports={
    invokefunc:invoke
}
```
这里的invoke不就是平时主动调用的代码吗，神奇在下面的rpc.exports这段代码，这段代码直接把这个函数封装成了一个可以被本地python调用的函数，本地python通过调用这个函数不就实现了rpc，客户端(Pc)调用了服务器(手机)上的函数（服务）吗？太妙了，前提是一定要先hook，然后主动调用hook的方法，然后在rpc，这里顺序不能乱！，创建一个python文件 
```
import time
import frida

def my_message_handler(message,payload):
    print(message)
    print(payload)
device=frida.get_usb_device()
#pid=device.spawn(["com.example.lesson4one"])
#device.resume
#time.sleep(1)
#session=device.attach(pid)
session=device.attach("com.example.lesson4one")
with open("lesson7lesson4.js") as f:
    script=session.create_script(f.read())
script.on("message",my_message_handler)
script.load()

command=""
while True:
    command=input("Enter Command:")
    if command=="1":
        break
    elif command=="2":
        script.exports.invokefunc()

```
# 0x02 frida(rpc)多主机多手机多端口混连
device=frida.get_device_manager().add_remote_device("ip:port")
其实就是用无线来连接，实现混连
# 0x03 frida互联互通和动态修改
还剩27分钟，谁能想到我被更新gradle给阻击了，好卡，下的好慢呜呜