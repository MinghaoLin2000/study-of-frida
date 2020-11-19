# Frida构造数组，对象，Map和类参数
1. 数组/（字符串）对象数组/gson/Java.array
2. 对象/多态，强转Java.cast
3. 接口interface，Java.register
4. 枚举，泛型，List,Map,Set,迭代打印
5. 重要思路:开发时如何打印，frida中也是如何打印
6. non-ascii 方法名 hook

# 0x01 
app代码:  
```
 Log.d("SimpleArray", "onCreate: SImpleArray");
        char arr[][] = new char[4][]; // 创建一个4行的二维数组
        arr[0] = new char[] { '春', '眠', '不', '觉', '晓' }; // 为每一行赋值
        arr[1] = new char[] { '处', '处', '闻', '啼', '鸟' };
        arr[2] = new char[] { '夜', '来', '风', '雨', '声' };
        arr[3] = new char[] { '花', '落', '知', '多', '少' };
        Log.d("SimpleArray", "-----横版-----");
        for (int i = 0; i < 4; i++) { // 循环4行
            //Log.d("SimpleArraysToString", Arrays.toString(arr[i]));
            //Log.d("SimpleStringBytes", Arrays.toString (Arrays.toString (arr[i]).getBytes()));
            for (int j = 0; j < 5; j++) { // 循环5列
                Log.d("SimpleArray", Character.toString(arr[i][j])); // 输出数组中的元素
            }
            if (i % 2 == 0) {
                Log.d("SimpleArray", ",");// 如果是一、三句，输出逗号
            } else {
                Log.d("SimpleArray", "。");// 如果是二、四句，输出句号
            }
        }
```
这里直接hook java.lang.Arrays的toString方法，打印出参数和返回值
```
function main()
{
    Java.perform(function(){
        Java.use("java.lang.Character").toString.overload('char').implementation=function(arg1)
        {
            var result=this.toString(arg1);
            console.log("x,result",arg1,result);
            return result;
        }
    })
}
setImmediate(main);
```
