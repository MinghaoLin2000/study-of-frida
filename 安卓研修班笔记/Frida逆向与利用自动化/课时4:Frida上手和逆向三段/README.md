# Frida上手和逆向三段
1. FRIDA基本操作：参数，调用栈，返回值
2. frida精髓2:方法重载，参数构造，动静态处理
3. frida精髓3:主动调用，忽略内部细节，直接返回结果
4. 逆向三段: (hook invoke) rpc

# 0x01 在kali上安装androidstudio，然后新建一个app项目，开始测试frida
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