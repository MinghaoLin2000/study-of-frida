# 综合实战
1. spawn/attach时机的选择
2. 各种主动调用/直接撸完
3. 各种hook以及构造函数
4. 动态加载自己的dex
5. z3:约束求解/符号执行

# 0x01 通过案例来进行实战
## 1.
这里又放了个新的apk，直接开冲，一启动就发现骚的地方的，居然说不是Russian的就无法登陆，乌拉！ 然后这里打开jadx，直接搜索这个提示框的字符串，肯定有地方做了检测，只要做了检测，我们就可以根据情况去hook，绕过,hook的原则也是，离数据越近越好。这里找到了关键代码:
```
   public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        setContentView((int) R.layout.activity_main);
        String property = System.getProperty("user.home");
        String str = System.getenv("USER");
        if (property == null || property.isEmpty() || !property.equals("Russia")) {
            a("Integrity Error", "This app can only run on Russian devices.");
        } else if (str == null || str.isEmpty() || !str.equals(getResources().getString(R.string.User))) {
            a("Integrity Error", "Must be on the user whitelist.");
        } else {
            a.a(this);
            startActivity(new Intent(this, LoginActivity.class));
        }
    }
}
````
原来是那个property字符串在搞鬼，那么直接hook那个赋值的方法的,这里有个技巧，快速查看类，比如这个System的类名，jadx下面有个按钮可以直接查看smail代码，一查看搜索就出来了，简直神器！
js的hook代码
```
function main()
{
    Java.perform(function(){
        Java.use("java.lang.System").getProperty.overload('java.lang.String').implementation=function(x)
        {
            var result=this.getProperty(x);
            console.log("x,result:",x,result);
            return Java.use("java.lang.String").$new("Russia");
        }

    })
}
setImmediate(main)
```
这里肯定得spawn上去了，因为点击就直接检测了。  
frida -U -f 包名 -l xxx.js  
%resume  
一把梭直接hook成功了,非常nice  
## 2.
没想到还有一个东西得绕过去，就是上面的第二个if，判断了一个字符串，是否等于getResources().getString(R.string.User),R.string.User这个东西在Resources/resources.arsc/res/values/strings.xml里面的，这里也是直接hook就完事了  
```
function main()
{
    Java.perform(function(){
        Java.use("java.lang.System").getProperty.overload('java.lang.String').implementation=function(x)
        {
            var result=this.getProperty(x);
            console.log("x,result:",x,result);
            return Java.use("java.lang.String").$new("Russia");
        }
        Java.use("java.lang.System").getenv.overload("java.lang.String").implementation=function(x)
        {
            var result=this.getenv(x);
            console.log("x,result:",x,result);
            return Java.use("java.lang.String").$new("RkxBR3s1N0VSTDFOR180UkNIM1J9Cg==");
        }

    })
}
setImmediate(main)
```
终端命令和上面一样的，一把梭，直接到了登陆界面了
## 3. 
账户密码啥的这里没啥好说的，账号明文就在上面的xml文件中，密码是md5，查表就出来了
## 4.
然后发现这里有个地方有点可疑  
```
package com.tlamb96.kgbmessenger;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.c;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import com.tlamb96.kgbmessenger.a.a;
import com.tlamb96.spetsnazmessenger.R;
import java.util.ArrayList;
import java.util.List;
import org.a.a.b;

public class MessengerActivity extends c {
    private RecyclerView m;
    private a n;
    private List<com.tlamb96.kgbmessenger.b.a> o;
    private String p = "V@]EAASB\u0012WZF\u0012e,a$7(&am2(3.\u0003";
    private String q;
    private String r = "\u0000dslp}oQ\u0000 dks$|M\u0000h +AYQg\u0000P*!M$gQ\u0000";
    private String s;

    private String a(String str) {
        char[] charArray = str.toCharArray();
        for (int i = 0; i < charArray.length / 2; i++) {
            char c = charArray[i];
            charArray[i] = (char) (charArray[(charArray.length - i) - 1] ^ '2');
            charArray[(charArray.length - i) - 1] = (char) (c ^ 'A');
        }
        return new String(charArray);
    }

    private String b(String str) {
        char[] charArray = str.toCharArray();
        for (int i = 0; i < charArray.length; i++) {
            charArray[i] = (char) ((charArray[i] >> (i % 8)) ^ charArray[i]);
        }
        for (int i2 = 0; i2 < charArray.length / 2; i2++) {
            char c = charArray[i2];
            charArray[i2] = charArray[(charArray.length - i2) - 1];
            charArray[(charArray.length - i2) - 1] = c;
        }
        return new String(charArray);
    }

    private String i() {
        if (this.q == null || this.s == null) {
            return "Nice try but you're not that slick!";
        }
        char[] charArray = this.q.substring(19).toCharArray();
        charArray[1] = (char) (charArray[1] ^ 'U');
        charArray[2] = (char) (charArray[2] ^ 'F');
        charArray[3] = (char) (charArray[3] ^ 'F');
        charArray[5] = (char) (charArray[5] ^ '_');
        Log.i("MessengerActivity", "flag: " + new String(charArray));
        char[] charArray2 = this.s.substring(7, 13).toCharArray();
        charArray2[1] = (char) (charArray2[1] ^ '}');
        charArray2[2] = (char) (charArray2[2] ^ 'v');
        charArray2[3] = (char) (charArray2[3] ^ 'u');
        return new String(charArray) + "_" + new String(charArray2);
    }

    private String j() {
        return new b().a("hh:mm a");
    }

    public void onBackPressed() {
        Intent intent = new Intent("android.intent.action.MAIN");
        intent.addCategory("android.intent.category.HOME");
        intent.setFlags(268435456);
        startActivity(intent);
    }

    /* access modifiers changed from: protected */
    public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        setContentView((int) R.layout.activity_messenger);
        getResources().getString(R.string.katya);
        getResources().getString(R.string.user);
        this.o = new ArrayList<com.tlamb96.kgbmessenger.b.a>() {
            {
                add(new com.tlamb96.kgbmessenger.b.a(R.string.katya, "Archer, you up?", "2:20 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.user, "no", "2:22 am", false));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.nikolai, "Omg Katya you're being so transparent...", "7:16 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.crenshaw, "LOL you should deport her", "7:28 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.user, "Why am I in this gc again?", "7:48 am", false));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.katya, "DEPORT me!? Where tf would you send me!?? I'm already stuck living in Russia", "8:02 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.boris, "Pls don't deport me", "8:05 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.katya, "Boris no one is talking about you", "8:06 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.nikolai, "Omg he's such a moron", "8:10 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.crenshaw, "ikr", "8:11 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.nikolai, "Remember that time he gave away the password to all KGB systems?", "8:12 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.crenshaw, "Yeah, all they had to do was ask for it", "8:13 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.katya, "You're joking, right? No one is that dumb", "8:13 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.crenshaw, "I'm 100% serious", "8:13 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.boris, "Well that's not all they had to do", "8:15 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.katya, "Wait, why do all KGB systems have the same password?", "9:20 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.nikolai, "We got tired of writing them down on sticky notes so we held a meeting and agreed on a password for the entire department", "9:22 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.crenshaw, "Idk why we didn't think of this solution earlier", "9:25 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.katya, "Does Boris know the password?", "9:26 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.nikolai, "Nah, he only has the password for his personal computer which is different than the dept's password", "9:27 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.crenshaw, "You thought we'd tell him again? If he told someone we would have to hold another dept meeting to come up with a new one", "9:28 am", true));
                add(new com.tlamb96.kgbmessenger.b.a(R.string.nikolai, "It took us three hours to agree on one last time", "9:27 am", true));
            }
        };
        this.m = (RecyclerView) findViewById(R.id.reyclerview_message_list);
        this.n = new a(this, this.o);
        this.m.setAdapter(this.n);
        LinearLayoutManager linearLayoutManager = new LinearLayoutManager(this);
        linearLayoutManager.a(true);
        this.m.setLayoutManager(linearLayoutManager);
        this.m.setNestedScrollingEnabled(false);
    }

    public void onSendMessage(View view) {
        EditText editText = (EditText) findViewById(R.id.edittext_chatbox);
        String obj = editText.getText().toString();
        if (!TextUtils.isEmpty(obj)) {
            this.o.add(new com.tlamb96.kgbmessenger.b.a(R.string.user, obj, j(), false));
            this.n.c();
            if (a(obj.toString()).equals(this.p)) {
                Log.d("MessengerActivity", "Successfully asked Boris for the password.");
                this.q = obj.toString();
                this.o.add(new com.tlamb96.kgbmessenger.b.a(R.string.boris, "Only if you ask nicely", j(), true));
                this.n.c();
            }
            if (b(obj.toString()).equals(this.r)) {
                Log.d("MessengerActivity", "Successfully asked Boris nicely for the password.");
                this.s = obj.toString();
                this.o.add(new com.tlamb96.kgbmessenger.b.a(R.string.boris, "Wow, no one has ever been so nice to me! Here you go friend: FLAG{" + i() + "}", j(), true));
                this.n.c();
            }
            this.m.b(this.m.getAdapter().a() - 1);
            editText.setText("");
        }
    }
}
```
本来想hook一波a和b方法，结果疯狂报错，肉丝姐也翻车了，所以换了一种思路，直接去逆向算法了。
这里直接看a方法的代码：
```
  private String a(String str) {
        char[] charArray = str.toCharArray();
        for (int i = 0; i < charArray.length / 2; i++) {
            char c = charArray[i];
            charArray[i] = (char) (charArray[(charArray.length - i) - 1] ^ '2');
            charArray[(charArray.length - i) - 1] = (char) (c ^ 'A');
        }
        return new String(charArray);
    }
```
这里加密过程其实不难理解，进行对半交换，交换的过程中，后半部分异或1，前半部分异或'A'，
直接写出来解密算法就好了，这里肉丝是编成了dex来frida动态加载进行执行，可能是为了方便之后的自动化。
### 编写dex，并动态加载dex
1. 这里androidstudio新建一个项目，然后新建一个类，将逆向的方法写在这个类中
```
package com.example.lesson9;

public class reversed {
    public static String decode_p()
    {
        String p = "V@]EAASB\u0012WZF\u0012e,a$7(&am2(3.\u0003";
        String result=a(p);
        return result;
    }
    private static String a(String str) {
        char[] charArray = str.toCharArray();
        for (int i = 0; i < charArray.length / 2; i++) {
            char c = charArray[i];
            charArray[i] = (char) (charArray[(charArray.length - i) - 1] ^ 'A');
            charArray[(charArray.length - i) - 1] = (char) (c ^ '2');
        }
        return new String(charArray);
    }
}
```
2. 然后make project，由gradle来进行编译，生成了apk
3. 然后我们进入到/root/AndroidStudioProjects/lesson9/app/build/intermediates/javac/debug/classes/com/example/lesson9目录下（这里可以右键androidstudio的包名目录，可以直接进入终端，虽然还是要调整，但是快了一些），然后使用/root/Android/Sdk/build-tools/29.0.3/d8，命令将逆向的class文件，打包成一个dex文件，push到android手机/data/local/tmp目录下
4. 


