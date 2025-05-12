---
title: 数据结构定义和 API
date: 2021-06-12 19:29:17
tags:
  - Algorithm
categories:
  - Algorithm
published: false
toc: "true"
comments: "true"
description: 定义总结
---
<!--more-->
### 0.1 链表

```java
public class SinglyListNode {
    int val;
    SinglyListNode next;
    SinglyListNode(int x) { val = x; }
}
```

### 0.2 树

```java
 public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
 }

for (double element: myList) {
    System.out.println(element);
}
```

### 0.3 数组

```java
int[] array = new int[5];
double[] myList; 
double[] myList = new double[10];
// 作为参数
public static void printArray(int[] array) {
  for (int i = 0; i < array.length; i++) {
    System.out.print(array[i] + " ");
  }
}
// 多维数组 前行后列
int[][] a = new int[2][3];
```

### 0.4 String 字符串

- 创建后不可变,要改变用 stringbuffer

```java
String str = "Runoob";
String str2=new String("Runoob");

//String的方法
char	  charAt(int index) 		//返回指定索引处的值
String	  concat(String str)  		//将指定的字符串连接到该字符串的末尾
boolean   contentEquals(StringBuffer sb)  	//将此字符串与指定的StringBuffer进行比较
int 	  indexOf(int ch)  			//返回指定字符第一次出现的字符串内的索引
int 	  indexOf(String str)  		//返回指定子字符串第一次出现的字符串内的索引
boolean	  isEmpty() 
int		  length()
String 	  valueOf(int i)  			//将 int 变量 i 转换成字符串(使用于其他数据类型)
String[]  split(String regex)  		//按regex将String切分成数组
char[] 	  toCharArray()  			//将此字符串转换为新的字符数组
String 	  trim()  					//删除前后的空格
String    substring(int beginIndex, int endIndex)  //获得子串，是左闭右开区间
  
不必考虑到线程同步问题，我们应该优先使用StringBuilder类；如果要保证线程安全，自然是StringBuffer。  
StringBuffer  方法
StringBuilder res = new StringBuilder();
StringBuffer sb = new StringBuffer();
StringBuffer sb = new StringBuffer(50);  // 容量为50
StringBuffer sb = new StringBuffer("Hello");
sb.append(" World");  // "Hello World"
sb.insert(5, " Java");  // "Hello Java World"
sb.replace(6, 10, "Beautiful");  // "Hello Beautiful World"
sb.delete(6, 15);  // "Hello World"
sb.deleteCharAt(5);  // "HelloWorld"
sb.reverse();  // "dlroWolleH"
sb.setCharAt(0, 'h');  // "helloWorld"
String sub = sb.substring(5);  // "World"
String sub = sb.substring(0, 5);  // "hello"
int len = sb.length();  // 10
res.toString()   //转换成string
```





### 0.5 ArrayList 底层是动态数组

- 频繁访问列表中的某一个元素。
- 只需要在列表末尾进行添加和删除元素操作。

```java
import java.util.ArrayList;
import java.util.Collections;  // 引入 Collections 类
List<String> sites = new ArrayList<>();   动态数组
sites.add("Google"); 		添加
sites.get(0); 					获取
sites.set(0, "Wiki");   修改
sites.remove(3);        删除第四个元素   
sites.size()            元素数量
Collections.sort(myNumbers);    排序  
for (String i : sites) {   迭代
     System.out.println(i);
}  

contains()	判断元素是否在 arraylist
indexOf()	返回 arraylist 中元素的索引值
removeAll()	删除存在于指定集合中的 arraylist 里的所有元素
isEmpty()	判断 arraylist 是否为空
subList()	截取部分 arraylist 的元素
toArray()	将 arraylist 转换为数组
toString()	将 arraylist 转换为字符串
ensureCapacity()	设置指定容量大小的 arraylist
lastIndexOf()	返回指定元素在 arraylist 中最后一次出现的位置
retainAll()	保留 arraylist 中在指定集合中也存在的那些元素
containsAll()	查看 arraylist 是否包含指定集合中的所有元素
trimToSize()	将 arraylist 中的容量调整为数组中的元素个数
removeRange()	删除 arraylist 中指定索引之间存在的元素
replaceAll()	将给定的操作内容替换掉数组中每一个元素
removeIf()	删除所有满足特定条件的 arraylist 元素
forEach()	遍历 arraylist 中每一个元素并执行特定操作

  
将数组转换为 ArrayList
String[] array = {"A", "B", "C"};
ArrayList<String> arrayList = new ArrayList<>(Arrays.asList(array));

将 ArrayList 转换为数组
String[] array = new String[arrayList.size()];
array = arrayList.toArray(array);
  
```

### 0.6 LinkedList 基于双向链表实现

- 你需要通过循环迭代来访问列表中的某些元素。
- 需要频繁的在列表开头、中间、末尾等位置进行添加和删除元素操作。

```java
LinkedList<String> sites = new LinkedList<String>();
sites.add("Google");
sites.addFirst("Wiki");
sites.addLast("Wiki");
sites.removeFirst();
sites.removeLast();
sites.getFirst()
for (String i : sites) {
    System.out.println(i);
}  
public int size()	返回链表元素个数。
public boolean contains(Object o)	判断是否含有某一元素  
```



### 0.7 HashSet

- 无重复元素的集合

```java
import java.util.HashSet; // 引入 HashSet 类
HashSet<String> sites = new HashSet<String>();
sites.add("Google");
sites.remove("Taobao"); 
sites.size()
```

### 0.8 HashMap

- 散列表 里面是键值对

```java
HashMap<Integer, String> Sites = new HashMap<Integer, String>();
Sites.put(1, "Google");
Sites.get(3))
Sites.remove(4);
Sites.clear();

containsKey()	检查 hashMap 中是否存在指定的 key 对应的映射关系。
containsValue()	检查 hashMap 中是否存在指定的 value 对应的映射关系。
replace(K key, V newValue)	替换 hashMap 中是指定的 key 对应的 value。

  
输出 key 和 value
for (Integer i : Sites.keySet()) {
    System.out.println("key: " + i + " value: " + Sites.get(i));
}

返回所有 value 值
for(String value: Sites.values()) {
// 输出每一个value
    System.out.print(value + ", ");
}
```



### 0.9 字符串

```java
```

