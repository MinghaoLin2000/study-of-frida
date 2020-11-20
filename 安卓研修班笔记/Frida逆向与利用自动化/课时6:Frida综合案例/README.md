# Frida综合情景案例
## 六层锁机案例
1. 调用静态函数和调用非静态函数
2. 设置（同名）成员变量
3. 内部类，枚举类的函数并hook，trace原型1
4. 查找接口，hook动态加载dex -"补充一个找interface的实现，“通杀”的方法“
5. 枚举class，trace原型2

6. 找hook点的一个原则:开发的视角，hook点离数据越近越好，换安卓版本·换frida版本试试

# 0x01 第一层
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
