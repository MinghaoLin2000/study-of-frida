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
# 0x05 第四关
```
package com.example.androiddemo.Activity;

import android.content.Intent;

public class FridaActivity4 extends BaseFridaActivity {
    public String getNextCheckTitle() {
        return "当前第4关";
    }

    private static class InnerClasses {
        public static boolean check1() {
            return false;
        }

        public static boolean check2() {
            return false;
        }

        public static boolean check3() {
            return false;
        }

        public static boolean check4() {
            return false;
        }

        public static boolean check5() {
            return false;
        }

        public static boolean check6() {
            return false;
        }

        private InnerClasses() {
        }
    }

    public void onCheck() {
        if (!InnerClasses.check1() || !InnerClasses.check2() || !InnerClasses.check3() || !InnerClasses.check4() || !InnerClasses.check5() || !InnerClasses.check6()) {
            super.CheckFailed();
            return;
        }
        CheckSuccess();
        startActivity(new Intent(this, FridaActivity5.class));
        finishActivity(0);
    }
}
```
这题是一个内部类的hook，同时有很多方法需要hook，所以可以使用反射的手法，得到方法的名字进行枚举hook，java和frida的关系密不可分，开发的视角万能
```
function forth()
{
    Java.perform(function(){
        /*
        Java.use("com.example.androiddemo.Activity.FridaActivity4$InnerClasses").check1.implementation=function()
        {
            return true;
        }
        Java.use("com.example.androiddemo.Activity.FridaActivity4$InnerClasses").check2.implementation=function()
        {
            return true;
        }
        Java.use("com.example.androiddemo.Activity.FridaActivity4$InnerClasses").check3.implementation=function()
        {
            return true;
        }
        Java.use("com.example.androiddemo.Activity.FridaActivity4$InnerClasses").check4.implementation=function()
        {
            return true;
        }
        Java.use("com.example.androiddemo.Activity.FridaActivity4$InnerClasses").check5.implementation=function()
        {
            return true;
        }*/
        
    })
}
function forth2()
{
    Java.perform(function(){
        var class_name="com.example.androiddemo.Activity.FridaActivity4$InnerClasses";
        var InnerClass=Java.use(class_name);
        var all_methods=InnerClass.class.getDeclaredMethods();
        //console.log(all_methods);
        for(var i=0;i<all_methods.length;i++)
        {
            var method=all_methods[i];
            console.log(method);
            var substring=method.toString().substr(method.toString().indexOf(class_name)+class_name.length+1);
            //console.log(substring);
            var finalMethodString=substring.substr(0,substring.indexOf("("));
            console.log(finalMethodString);
            InnerClass[finalMethodString].implementation=function(){return true};
        }
    })
}
setImmediate(forth2)
```
# 0x06 第5关
hook代码
```
package com.example.androiddemo.Activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
import com.example.androiddemo.Dynamic.CheckInterface;
import dalvik.system.DexClassLoader;
import java.io.File;
import java.io.IOException;

public class FridaActivity5 extends BaseFridaActivity {
    private CheckInterface DynamicDexCheck = null;

    public String getNextCheckTitle() {
        return "当前第5关";
    }

    /* JADX WARNING: type inference failed for: r0v0 */
    /* JADX WARNING: type inference failed for: r0v1, types: [java.io.OutputStream] */
    /* JADX WARNING: type inference failed for: r0v2 */
    /* JADX WARNING: type inference failed for: r0v3, types: [java.io.InputStream] */
    /* JADX WARNING: type inference failed for: r0v4 */
    /* JADX WARNING: Multi-variable type inference failed */
    /* JADX WARNING: Removed duplicated region for block: B:28:0x0043 A[SYNTHETIC, Splitter:B:28:0x0043] */
    /* JADX WARNING: Removed duplicated region for block: B:33:0x004b A[Catch:{ IOException -> 0x0047 }] */
    /* JADX WARNING: Removed duplicated region for block: B:39:0x0058 A[SYNTHETIC, Splitter:B:39:0x0058] */
    /* JADX WARNING: Removed duplicated region for block: B:44:0x0060 A[Catch:{ IOException -> 0x005c }] */
    /* JADX WARNING: Removed duplicated region for block: B:49:? A[RETURN, SYNTHETIC] */
    /* Code decompiled incorrectly, please refer to instructions dump. */
    public static void copyFiles(android.content.Context r2, java.lang.String r3, java.io.File r4) {
        /*
            r0 = 0
            android.content.Context r2 = r2.getApplicationContext()     // Catch:{ IOException -> 0x003c, all -> 0x0039 }
            android.content.res.AssetManager r2 = r2.getAssets()     // Catch:{ IOException -> 0x003c, all -> 0x0039 }
            java.io.InputStream r2 = r2.open(r3)     // Catch:{ IOException -> 0x003c, all -> 0x0039 }
            java.io.FileOutputStream r3 = new java.io.FileOutputStream     // Catch:{ IOException -> 0x0035, all -> 0x0033 }
            java.lang.String r4 = r4.getAbsolutePath()     // Catch:{ IOException -> 0x0035, all -> 0x0033 }
            r3.<init>(r4)     // Catch:{ IOException -> 0x0035, all -> 0x0033 }
            r4 = 1024(0x400, float:1.435E-42)
            byte[] r4 = new byte[r4]     // Catch:{ IOException -> 0x0031, all -> 0x002f }
        L_0x001a:
            int r0 = r2.read(r4)     // Catch:{ IOException -> 0x0031, all -> 0x002f }
            r1 = -1
            if (r0 == r1) goto L_0x0026
            r1 = 0
            r3.write(r4, r1, r0)     // Catch:{ IOException -> 0x0031, all -> 0x002f }
            goto L_0x001a
        L_0x0026:
            if (r2 == 0) goto L_0x002b
            r2.close()     // Catch:{ IOException -> 0x0047 }
        L_0x002b:
            r3.close()     // Catch:{ IOException -> 0x0047 }
            goto L_0x0052
        L_0x002f:
            r4 = move-exception
            goto L_0x0055
        L_0x0031:
            r4 = move-exception
            goto L_0x0037
        L_0x0033:
            r4 = move-exception
            goto L_0x0056
        L_0x0035:
            r4 = move-exception
            r3 = r0
        L_0x0037:
            r0 = r2
            goto L_0x003e
        L_0x0039:
            r4 = move-exception
            r2 = r0
            goto L_0x0056
        L_0x003c:
            r4 = move-exception
            r3 = r0
        L_0x003e:
            r4.printStackTrace()     // Catch:{ all -> 0x0053 }
            if (r0 == 0) goto L_0x0049
            r0.close()     // Catch:{ IOException -> 0x0047 }
            goto L_0x0049
        L_0x0047:
            r2 = move-exception
            goto L_0x004f
        L_0x0049:
            if (r3 == 0) goto L_0x0052
            r3.close()     // Catch:{ IOException -> 0x0047 }
            goto L_0x0052
        L_0x004f:
            r2.printStackTrace()
        L_0x0052:
            return
        L_0x0053:
            r4 = move-exception
            r2 = r0
        L_0x0055:
            r0 = r3
        L_0x0056:
            if (r2 == 0) goto L_0x005e
            r2.close()     // Catch:{ IOException -> 0x005c }
            goto L_0x005e
        L_0x005c:
            r2 = move-exception
            goto L_0x0064
        L_0x005e:
            if (r0 == 0) goto L_0x0067
            r0.close()     // Catch:{ IOException -> 0x005c }
            goto L_0x0067
        L_0x0064:
            r2.printStackTrace()
        L_0x0067:
            goto L_0x0069
        L_0x0068:
            throw r4
        L_0x0069:
            goto L_0x0068
        */
        throw new UnsupportedOperationException("Method not decompiled: com.example.androiddemo.Activity.FridaActivity5.copyFiles(android.content.Context, java.lang.String, java.io.File):void");
    }

    private void loaddex() {
        File filesDir = getFilesDir();
        if (!filesDir.exists()) {
            filesDir.mkdir();
        }
        String str = filesDir.getAbsolutePath() + File.separator + "DynamicPlugin.dex";
        File file = new File(str);
        try {
            if (!file.exists()) {
                file.createNewFile();
                copyFiles(this, "DynamicPlugin.dex", file);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        try {
            this.DynamicDexCheck = (CheckInterface) new DexClassLoader(str, filesDir.getAbsolutePath(), (String) null, getClassLoader()).loadClass("com.example.androiddemo.Dynamic.DynamicCheck").newInstance();
            if (this.DynamicDexCheck == null) {
                Toast.makeText(this, "loaddex Failed!", 1).show();
            }
        } catch (Exception e2) {
            e2.printStackTrace();
        }
    }

    public CheckInterface getDynamicDexCheck() {
        if (this.DynamicDexCheck == null) {
            loaddex();
        }
        return this.DynamicDexCheck;
    }

    /* access modifiers changed from: protected */
    public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        loaddex();
    }

    public void onCheck() {
        if (getDynamicDexCheck() == null) {
            Toast.makeText(this, "onClick loaddex Failed!", 1).show();
        } else if (getDynamicDexCheck().check()) {
            CheckSuccess();
            startActivity(new Intent(this, FridaActivity6.class));
            finishActivity(0);
        } else {
            super.CheckFailed();
        }
    }
}
```
这关有点绕，其实就是自定义了一个dexclassloader，并把dex中的类加载进来了，至于hook这种操作，其实我也挺懵的，先是枚举classloader，然后进行替换，替换后再进行hook，这里有些不理解，暂时先记住，应该是啥java类加载的特性
function fifth()
{
    Java.perform(function(){
        Java.choose("com.example.androiddemo.Activity.FridaActivity5",{
            onMatch:function(instance){
                console.log("found instance getDynamicDexCheck :",instance.getDynamicDexCheck().$className);
            },onComplete:function(){console.log("search complete")}
        })
        Java.enumerateClassLoaders({
            onMatch:function(loader){
                try{
                    if(loader.findClass("com.example.android.Dynamic.DynamicCheck"))
                    {
                        console.log("Successfully found loader",loader);
                        Java.classFactory.loader=loader;
                    }
                }catch(error)
                {
                    console.log("found error "+error)
                }
            },onComplete:function(){"enum completed!"}
        })
        Java.use("com.example.android.Dynamic.DynamicCheck").check.implementation=function(){return true};
    })
}
setImmediate(fifth);
# 0x07 第6关
这题就是主要就是枚举类，然后通过反射得到类名，直接枚举hook
```
function sixth()
{
    Java.perform(function(){
        Java.use("com.example.androiddemo.Activity.Frida6.Frida6Class0").check.implementation=function(){return true};
        Java.use("com.example.androiddemo.Activity.Frida6.Frida6Class1").check.implementation=function(){return true};
        Java.use("com.example.androiddemo.Activity.Frida6.Frida6Class2").check.implementation=function(){return true};


    })
}
function sixth2()
{
    Java.perform(function(){
        Java.enumerateLoadedClasses({
            onMatch:function(name,handle){
                if(name.toString().indexOf("com.example.androiddemo.Activity.Frida6.Frida6"))
                {
                    Java.use(name).check.implementation=function()
                    {
                        return true;
                    }
                }
            }
        })
            
        
    })
}
setImmediate(fifth);
```
