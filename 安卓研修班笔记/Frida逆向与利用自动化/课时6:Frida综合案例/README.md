# Frida综合情景案例
## 六层锁机案例
1. 调用静态函数和调用非静态函数
2. 设置（同名）成员变量
3. 内部类，枚举类的函数并hook，trace原型1
4. 查找接口，hook动态加载dex -"补充一个找interface的实现，“通杀”的方法“
5. 枚举class，trace原型2

6. 找hook点的一个原则:开发的视角，hook点离数据越近越好，换安卓版本·换frida版本试试

# 0x01 入门关
先找到hook点，搜索一波字符串，找到关键代码
 ```
  public void onClick(View view) {
                String obj = editText.getText().toString();
                String obj2 = editText2.getText().toString();
                if (TextUtils.isEmpty(obj) || TextUtils.isEmpty(obj2)) {
                    Toast.makeText(LoginActivity.this.mContext, "username or password is empty.", 1).show();
                } else if (LoginActivity.a(obj, obj).equals(obj2)) {
                    LoginActivity.this.startActivity(new Intent(LoginActivity.this.mContext, FridaActivity1.class));
                    LoginActivity.this.finishActivity(0);
                } else {
                    Toast.makeText(LoginActivity.this.mContext, "Login failed.", 1).show();
                }
```
这里明显是LoginActivity类的a方法是hook点，大概看了一波这里不用管a里面具体方法的内容是什么，这里我们只需要知道就是我们的password是要与a方法的返回值相同的，也就是我们通过hook这个方法得到返回就是我们的password  
```
function main()
{
    Java.perform(function(){
        Java.use("com.example.androiddemo.Activity.LoginActivity").a.overload('java.lang.String', 'java.lang.String').implementation=function(x1,x2)
        {
            var result=this.a(x1,x2);
            console.log("x1,result:",x1,result);
            return result;
        }



    })
}
setImmediate(main)
```
以spawn或attach的方式启动都可以
# 0x02 第一关
也是先搜索关键字符串check faild，找到hook点之后
```public void onCheck() {
        try {
            if (a(b("请输入密码:")).equals("R4jSLLLLLLLLLLOrLE7/5B+Z6fsl65yj6BgC6YWz66gO6g2t65Pk6a+P65NK44NNROl0wNOLLLL=")) {
                CheckSuccess();
                startActivity(new Intent(this, FridaActivity2.class));
                finishActivity(0);
                return;
            }
            super.CheckFailed();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
```
只要让那个a方法返回值固定返回后面的那个就可以直接下一关了
# 0x03 第二关
找到hook点
```

public class FridaActivity2 extends BaseFridaActivity {
    private static boolean static_bool_var = false;
    private boolean bool_var = false;

    public String getNextCheckTitle() {
        return "当前第2关";
    }

    private static void setStatic_bool_var() {
        static_bool_var = true;
    }

    private void setBool_var() {
        this.bool_var = true;
    }

    public void onCheck() {
        if (!static_bool_var || !this.bool_var) {
            super.CheckFailed();
            return;
        }
        CheckSuccess();
        startActivity(new Intent(this, FridaActivity3.class));
        finishActivity(0);
    }
}
```
发现很简单，只需要主动调用那两个方法去改变bool值就好了，不过一个是静态，一个是动态的，静态的只需要Java.use,实例的方法需要instance来调用  
```
function second()
{
    Java.perform(function(){
        Java.use("com.example.androiddemo.Activity.FridaActivity2").setStatic_bool_var();
        Java.choose("com.example.androiddemo.Activity.FridaActivity2",{
            onMatch:function(instance){
                console.log("instance:",instance);
                instance.setBool_var();
            },onComplete:function(){}
        })

    })
}
setImmediate(second)
```
# 0x04 第三关
```
public class FridaActivity3 extends BaseFridaActivity {
    private static boolean static_bool_var = false;
    private boolean bool_var = false;
    private boolean same_name_bool_var = false;

    public String getNextCheckTitle() {
        return "当前第3关";
    }

    private void same_name_bool_var() {
        Log.d("Frida", static_bool_var + " " + this.bool_var + " " + this.same_name_bool_var);
    }

    public void onCheck() {
        if (!static_bool_var || !this.bool_var || !this.same_name_bool_var) {
            super.CheckFailed();
            return;
        }
        CheckSuccess();
        startActivity(new Intent(this, FridaActivity4.class));
        finishActivity(0);
    }
}
```
这里直接改变这三个字段，不过有分静态变量和实例变量的，还有一个变量和方法同名，
有不同的处理方式，静态变量直接通过类来改变，实例变量只能通过对象来改变，同名的可以通过加下划线解决  
```
function Third()
{
    Java.perform(function(){
        Java.use("com.example.androiddemo.Activity.FridaActivity3").static_bool_var.value=true;
        Java.choose("com.example.androiddemo.Activity.FridaActivity3",{
            onMatch:function(instance){
                console.log("found instance",instance);
                instance.bool_var.value=true;
                instance._same_name_bool_var.value=true;
            },onComplete:function(){}
        })
    })
}
setImmediate(Third)
```
