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
这里肉丝重新写了一个lesson7sec的app，主活动大概是这样的
```
package com.example.lesson7sec;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

public class MainActivity extends AppCompatActivity {

    EditText username_et;
    EditText password_et;
    TextView message_tv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        password_et = (EditText) this.findViewById(R.id.editText2);
        username_et = (EditText) this.findViewById(R.id.editText);
        message_tv = ((TextView) findViewById(R.id.textView));

        this.findViewById(R.id.button).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                if (username_et.getText().toString().compareTo("admin") == 0) {
                    message_tv.setText("You cannot login as admin");
                    return;
                }
                //hook target
                message_tv.setText("Sending to the server :" + Base64.encodeToString((username_et.getText().toString() + ":" + password_et.getText().toString()).getBytes(), Base64.DEFAULT));

            }
        });

    }
}
```
发现就是一个很平常的登陆界面，一个用户名一个密码，不过这里有个限制，输入账号和密钥后，直接点击登陆后，先判断用户名是否为admin，只有不是admin用户才能使用这个登陆框登陆，不过这题的意思就是为了打破这个限制，使得用户名可以输入admin，进行登陆，主要的操作逻辑在于hook这个setText方法，先把参数取出来，然后发送消息，给本地的python的代码进行处理，处理完后，再响应回去，再调用原方法，偷梁换柱 ，至于写法都是固定的，直接搬过来，改动一下就好了

先放个js代码，这里和rpc不同的是，不需要function作为外壳了，直接以Java.perform作为一个主体
```
Java.perform(function()
    {
        Java.use("android.widget.TextView").setText.overload("java.lang.CharSequence").implementation=function(x){
            var string_to_send_x=x.toString();
            var string_to_recv;
            //console.log("arg :x",x.toString());

            send(string_to_send_x);
            
            recv(function(received_json_objection){
                string_to_recv=received_json_objection.my_data
                console.log("string_to_recv"+string_to_recv)
            }).wait();
            

            var javaStringToSend=Java.use("java.lang.String").$new(string_to_recv);
            var result=this.setText(javaStringToSend);
            console.log("x.toString(),result",x.toString(),result);
            return result;
        
        }
    })
```
python的代码,处理的主要过程在python这里
```
import time
import frida
import base64

def my_message_handler(message,payload):
    print(message)
    print(payload)
    if message["type"]=="send":
        print(message["payload"])
        data=message["payload"].split(":")[1].strip()
        print("message",message)
        data=str(base64.b64decode(data))
        print("data:",data)
        usr,pw=data.split(":")
        print("pw:",pw)
        data=str(base64.b64encode(("admin"+":"+pw).encode()))
        print("encode data:",data)
        script.post({"my_data":data})
        print("Modified data sent!")
device=frida.get_usb_device()
#device=frida.get_device_manager().add_remote_device("ip:port")
#pid=device.spawn(["com.example.lesson4one"])
#device.resume
#time.sleep(1)
#session=device.attach(pid)
session=device.attach("com.example.lesson7sec")
with open("lesson7sec.js") as f:
    script=session.create_script(f.read())
script.on("message",my_message_handler)
script.load()
input()
```
