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