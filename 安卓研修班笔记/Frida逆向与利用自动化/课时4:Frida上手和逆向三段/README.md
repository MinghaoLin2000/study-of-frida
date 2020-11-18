# Frida上手和逆向三段
1. FRIDA基本操作：参数，调用栈，返回值
2. frida精髓2:方法重载，参数构造，动静态处理
3. frida精髓3:主动调用，忽略内部细节，直接返回结果
4. 逆向三段: (hook invoke) rpc

# 0x01 在kali上安装androidstudio，然后新建一个app项目，开始测试frida
# 1. 小试牛刀  

app中的主代码
```
m.example.lesson4one;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        while(true)
        {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            fun(50,80);
        }
    }
    int fun(int x,int y)
    {
        Log.d("YenKoc",String.valueOf(x+y));
       return x+y;
    }
}
```
hook的js文件，这里和肉丝在github上有点区别，肉丝在github上发的文章上的话，是利用python来作为一个载体执行js，盲猜可能是后面rpc才会用到，这种js直接启动真的香  
这里编写js文件，我选择是在FRIDA-AGENT-EXAMPLE中的agent文件夹下编写，没有为什么，问就是有智能提示2333
```
function main()
{
    Java.perform(function(){
        Java.use("com.example.lesson4one.MainActivity").fun.implementation=function(arg1,arg2)
        {
            var result=this.fun(arg1,arg2);
            console.log("arg1,arg2,result",arg1,arg2,result);
            return result;
        }
    })
}
setImmediate(main)
```
在vscode中打开终端(Terminal在界面的左上)，先进入（cd）js所在目录后，然后输入命令:  
frida -U 包名 -l xxx.js  
发现参数和返回值都打印出来了  
# 2. 改变参数和返回值，修改一个app代码
```
package com.example.lesson4one;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        while(true)
        {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            int m=fun(50,80);
            Log.d("kanxue m =", String.valueOf(m));
        }
    }
    int fun(int x,int y)
    {
        Log.d("YenKoc",String.valueOf(x+y));
       return x+y;
    }

}
```
把js代码也修改一下
```
function main()
{
    Java.perform(function(){
        Java.use("com.example.lesson4one.MainActivity").fun.implementation=function(arg1,arg2)
        {
            var result=this.fun(arg1,arg2);
            console.log("arg1,arg2,result",arg1,arg2,result);
            return 800;
        }
    })
}
setImmediate(main)
```
同样执行后，发现log中的返回值发生了改变了，说明hook成功了

# 3. 方法的重载处理
修改一下app代码，增加一个重载方法以及一个未被调用的方法
```
package com.example.lesson4one;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;

public class MainActivity extends AppCompatActivity {
    private String total="";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        while(true)
        {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            int m=fun(50,80);
            Log.d("YenKoc m =", String.valueOf(m));
            Log.d("YenKoc tolowercase", fun("LOWERCASEME!"));
        }
    }
    String fun(String x)
    {
        total+=x;
        return x.toLowerCase();
    }
    int fun(int x,int y)
    {
        Log.d("YenKoc",String.valueOf(x+y));
       return x+y;
    }
    String secret()
    {
        return total;
    }


}
```
这里再运行之前的js代码肯定会报错，因为有方法的重载，这里需要重新处理,重新修改后的js代码  
```
function main()
{
    Java.perform(function(){
        Java.use("com.example.lesson4one.MainActivity").fun.overload('int', 'int').implementation=function(arg1,arg2)
        {
            var result=this.fun(arg1,arg2);
            //console.log(Java.use('android.util.log').getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log("arg1,arg2,result",arg1,arg2,result);
            return 800;
        }
        Java.use("com.example.lesson4one.MainActivity").fun.overload('java.lang.String').implementation=function(arg1)
        {
                var result=this.fun(arg1);
                console.log("arg1 result",arg1,result);
                return result;
        }
    })
}
setImmediate(main)
```
overload都是从报错信息中复制粘贴的，真香  
接下来修改参数或返回值:
```
function main()
{
    Java.perform(function(){
        Java.use("com.example.lesson4one.MainActivity").fun.overload('int', 'int').implementation=function(arg1,arg2)
        {
            var result=this.fun(arg1,arg2);
            //console.log(Java.use('android.util.log').getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log("arg1,arg2,result",arg1,arg2,result);
            return 800;
        }
        Java.use("com.example.lesson4one.MainActivity").fun.overload('java.lang.String').implementation=function(arg1)
        {
                var result=this.fun("NIHAO");
                console.log("arg1 result",arg1,result);
                return result;
        }
    })
}
setImmediate(main)
```
这里又引出了一个frida启动spawn的方法，重新自启动
frida -U -f 包名 -l xxxx.js执行后，再执行%resume，重新执行   
这里的字符串不是java的字符串而是js的，虽然有自动转换，最好还是直接使用java的api生成字符串  
```
function main()
{
    Java.perform(function(){
        Java.use("com.example.lesson4one.MainActivity").fun.overload('int', 'int').implementation=function(arg1,arg2)
        {
            var result=this.fun(arg1,arg2);
            //console.log(Java.use('android.util.log').getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log("arg1,arg2,result",arg1,arg2,result);
            return 800;
        }
        Java.use("com.example.lesson4one.MainActivity").fun.overload('java.lang.String').implementation=function(arg1)
        {
                var result=this.fun(Java.use("java.lang.String").$new("NIHAOJAVA"));
                console.log("arg1 result",arg1,result);
                return result;
        }
    })
}
setImmediate(main)
```

# 4. 这里额外插一个调用栈的代码
```
function main()
{
    Java.perform(function(){
        Java.use("com.example.lesson4one.MainActivity").fun.implementation=function(arg1,arg2)
        {
            var result=this.fun(arg1,arg2);
            console.log(Java.use('android.util.log').getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log("arg1,arg2,result",arg1,arg2,result);
            return 800;
        }
    })
}
setImmediate(main)
```