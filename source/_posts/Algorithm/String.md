---
title: "[Algorithm] String"
date: 2021-06-12 19:29:17
tags:
  - Algorithm
categories:
  - Algorithm
published: true
toc: "true"
comments: "true"
description: 字符串总结
---
<!-- more -->

### 0.1 字符串常用方法

- 不必考虑到线程同步问题，我们应该优先使用StringBuilder类；如果要保证线程安全，自然是StringBuffer。

```java
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

### 0.2 [剑指 Offer 58 - I. 翻转单词顺序](https://leetcode-cn.com/problems/fan-zhuan-dan-ci-shun-xu-lcof/)

输入一个英文句子，翻转句子中单词的顺序，但单词内字符的顺序不变。为简单起见，标点符号和普通字母一样处理

```java
//split()将字符串按空格分割，倒序遍历，将单词拼接到StringBuilder，去空格后返回
class Solution {
    public String reverseWords(String s) {
        String[] strs = s.trim().split(" "); // 删除首尾空格，分割字符串
        StringBuilder res = new StringBuilder();
        for(int i = strs.length - 1; i >= 0; i--) { // 倒序遍历单词列表
            if(strs[i].equals("")) continue; // 遇到空单词则跳过
            res.append(strs[i] + " "); // 将单词拼接至 StringBuilder
        }
        return res.toString().trim(); // 转化为字符串，删除尾部空格，并返回
    }
}

//倒序，逐个确定每个单词的边界
class Solution {
    public String reverseWords(String s) {
        s = s.trim(); // 删除首尾空格
        int j = s.length() - 1, i = j;
        StringBuilder res = new StringBuilder();
        while(i >= 0) {
            while(i >= 0 && s.charAt(i) != ' ') i--; // 搜索首个空格
            res.append(s.substring(i + 1, j + 1) + " "); // 添加单词
            while(i >= 0 && s.charAt(i) == ' ') i--; // 跳过单词间空格
            j = i; // j 指向下个单词的尾字符
        }
        return res.toString().trim(); // 转化为字符串并返回
    }
}
```



### 0.3 [409. 最长回文串](https://leetcode-cn.com/problems/longest-palindrome/)

给定一个包含大写字母和小写字母的字符串，找到通过这些字母构造成的最长的回文串。

```java
//统计每个字符的个数
//每对字符都可以组成回文串，因为中间的可以是单个，如果还有剩余的单个，可以加一个上去
class Solution {
    public int longestPalindrome(String s) {
        int res = 0;
        HashMap<Character,Integer> map = new HashMap<>();
        for(int i = 0 ; i < s.length() ; i++){
            char c = s.charAt(i);
            map.put(c, map.getOrDefault(c,0) + 1);
        }
        for(char c: map.keySet()){
            res += (map.get(c) / 2) * 2;
        }
        if(res < s.length()){
            res++;
        }
        return res;
    }
}

//用数组统计
class Solution {
    public int longestPalindrome(String s) {
        int[] cnt = new int[256];
        for(char c : s.toCharArray()){
            cnt[c]++;
        }
        int result = 0;
        for(int i : cnt){
            result += (i/2)*2;
        }
        if(result < s.length()){
            result++;//这种情况有单独的字符
        }
        return result;
            
    }
}
```



### 0.4 [205. 同构字符串](https://leetcode-cn.com/problems/isomorphic-strings/)

给定两个字符串 s 和 t，判断它们是否是同构的。

如果 s 中的字符可以被替换得到 t ，那么这两个字符串是同构的。

所有出现的字符都必须用另一个字符替换，同时保留字符的顺序。两个字符不能映射到同一个字符上，但字符可以映射自己本身。

```java
//记录一个字符上次出现的位置，如果两个字符串中上次出现的位置一样，那么就是同构
//如 egg add g上次出现在2，d也上次出现在2，那么它们就是同构的
class Solution {
    public boolean isIsomorphic(String s, String t) {
        int[] indexOft = new int[256];
        int[] indexOfs = new int[256];
        for(int i = 0; i < s.length(); i++){
            char cs = s.charAt(i);
            char ct = t.charAt(i);
            if(indexOfs[cs] != indexOft[ct]){
                return false;
            }
            //防止一开始放进去的是0，无法区分
            indexOfs[cs] = i + 1;
            indexOft[ct] = i + 1;
        }
        return true;
    }
}
```



### 0.5 [647. 回文子串](https://leetcode-cn.com/problems/palindromic-substrings/)

给定一个字符串，你的任务是计算这个字符串中有多少个回文子串。

具有不同开始位置或结束位置的子串，即使是由相同的字符组成，也会被视作不同的子串。

```java
class Solution{
    public int countSubstrings(String s) {
        // 中心扩展法
        int ans = 0;
        //可以从一个字符向两侧扩展，也可以从两个相邻字符开始扩展，这样可以覆盖所有可能的子串
        //这样的单个字符有n个，两个有n-1个，所以合计有2n-1个中心点
        for (int center = 0; center < 2 * s.length() - 1; center++) {
            // left和right指针和中心点的关系是？
            // 首先是left，有一个很明显的2倍关系的存在，其次是right，可能和left指向同一个（偶数时），也可能往后移动一个（奇数）
            // 大致的关系出来了，可以选择带两个特殊例子进去看看是否满足。
            int left = center / 2;
            int right = left + center % 2;
            //在字符串范围内向两侧拓展
            while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
                ans++;
                left--;
                right++;
            }
        }
        return ans;
    }
}
```



### 0.6 [696. 计数二进制子串](https://leetcode-cn.com/problems/count-binary-substrings/)

给定一个字符串 s，计算具有相同数量0和1的非空(连续)子字符串的数量，并且这些子字符串中的所有0和所有1都是组合在一起的。

```java
//统计相同连续数字的个数，取其中的较小
class Solution {
    public int countBinarySubstrings(String s) {
        //统计当前数字连续的个数
        int curCnt = 1;
        //记录上一个数字连续的个数
        int preCnt = 0;
        int result = 0;
        for(int i = 1; i < s.length(); i++){
            //如果和前一个一样，当前连续个数++
            if(s.charAt(i) == s.charAt(i-1)){
                curCnt++;
            //否则，记录下，作为前一个连续数字个数，然后重置当前
            }else{
                preCnt = curCnt;
                curCnt = 1;
            }
			//前一个数连续的个数大于当前，那么就多一种子串
            if(preCnt >= curCnt){
                result++;
            }
        }
        return result;
    }
}
```



### 0.7 [剑指 Offer 19. 正则表达式匹配](https://leetcode-cn.com/problems/zheng-ze-biao-da-shi-pi-pei-lcof/)

请实现一个函数用来匹配包含'. '和'/*'的正则表达式。模式中的字符'.'表示任意一个字符，而'*'表示它前面的字符可以出现任意次（含0次）。在本题中，匹配是指字符串的所有字符匹配整个模式。例如，字符串"aaa"与模式"a.a"和"ab*ac*a"匹配，但与"aa.a"和"ab*a"均不匹配。

```java
//'.'可以表示任意一个字符
//'*'表示前面的字符可以出现任意次
/*
有三种情况：
1.B的最后一个是正常字符，那么比较AB最后一个，相等则往前一位
2.B的最后是'.'，可以直接往前一位
3.B的最后是'*'，代表B的倒数第二个可以重复一次，或者多次
	如果A的最后匹配失败，那么B往前两位
	如果匹配成功，那么A匹配完往前，B继续
f[i][j] 代表 A 的前 i 个和 B 的前 j 个能否匹配
对于前面两个情况，可以合并成一种情况 f[i][j] = f[i-1][j-1]
对于第三种情况，对于 c*c∗ 分为看和不看两种情况
不看：直接砍掉正则串的后面两个， f[i][j] = f[i][j-2]
看：正则串不动，主串前移一个，f[i][j] = f[i-1][j] 
*/

class Solution {
    public boolean isMatch(String s, String p) {
        int n = s.length();
        int m = p.length();
        boolean[][] f = new boolean[n+1][m+1];
        for(int i = 0; i <= n ; i++ ){
            for(int j = 0 ; j <= m; j++){
                //如果j=0，那么只有i也是0的情况匹配成功
                if(j == 0) f[i][j] = i == 0;
                else {
                    //如果p最后一位不是'*'
                    if(p.charAt(j-1) != '*'){
                        //如果相等，或者p的最后是'.'，那么都向前
                        if(i > 0 && (s.charAt(i-1) == p.charAt(j-1) || p.charAt(j-1) == '.')){
                            f[i][j] = f[i-1][j-1];
                        }
                    }else{
                        //碰到'*'
                        //不看，能否匹配取决于B串砍两位后能否匹配成功
                        if(j >= 2){
                            //只要有一个成立就都成立
                            f[i][j] |= f[i][j-2];

                        }
						//看，正则串不动，主串前移
                        if(i >= 1 && j >= 2 && (s.charAt(i-1) == p.charAt(j-2) || p.charAt(j-2) == '.')){
                            f[i][j] |= f[i-1][j];
                        }
 
                    }
                }
            }

        }
        return f[n][m];
    }
}
```



### 0.8 [剑指 Offer 48. 最长不含重复字符的子字符串](https://leetcode-cn.com/problems/zui-chang-bu-han-zhong-fu-zi-fu-de-zi-zi-fu-chuan-lcof/)

给定一个字符串，请你找出其中不含有重复字符的 最长子串 的长度。

```java
//滑动窗口实现
//维护一个left，表示窗口的最左侧
//维护一个HashMap，记录窗口内的元素和位置
//当加入了一个当前窗口内已有的值，直接通过HashMap获取位置，重置left
class Solution {
    public int lengthOfLongestSubstring(String s) {
        if (s.length()==0) return 0;
        HashMap<Character, Integer> map = new HashMap<Character, Integer>();
        int max = 0;
        int left = 0;
        for(int i = 0; i < s.length(); i ++){
            //如果这个元素出现过
            if(map.containsKey(s.charAt(i))){
                //如果在窗口内，left跳转到它的下一个
                left = Math.max(left,map.get(s.charAt(i)) + 1);
            }
            //放入当前
            map.put(s.charAt(i),i);
            //计算当前窗口值是否最大
            max = Math.max(max,i-left+1);
        }
        return max;   
    }
}
```



### 0.9 [剑指 Offer 67. 把字符串转换成整数](https://leetcode-cn.com/problems/ba-zi-fu-chuan-zhuan-huan-cheng-zheng-shu-lcof/)

写一个函数 StrToInt，实现把字符串转换成整数这个功能。不能使用 atoi 或者其他类似的库函数。

首先，该函数会根据需要丢弃无用的开头空格字符，直到寻找到第一个非空格的字符为止。

当我们寻找到的第一个非空字符为正或者负号时，则将该符号与之后面尽可能多的连续数字组合起来，作为该整数的正负号；假如第一个非空字符是数字，则直接将其与之后连续的数字字符组合起来，形成整数。

该字符串除了有效的整数部分之后也可能会存在多余的字符，这些字符可以被忽略，它们对于函数不应该造成影响。

注意：假如该字符串中的第一个非空格字符不是一个有效整数字符、字符串为空或字符串仅包含空白字符时，则你的函数不需要进行转换。

在任何情况下，若函数不能进行有效的转换时，请返回 0。



```java
class Solution {
    public int strToInt(String str) {
        //去除两端空格
        str = str.trim();
        //判空
        if(str.length() == 0) return 0;
        int  res = 0;
        //标记是否为负
        int flag = 1;
        //记录当前所指字符位置
        int i = 0;
        if(str.charAt(0) == '-') flag = -1;
        //有符号，前进一位
        if (str.charAt(0) == '-' || str.charAt(0) == '+') i++;
        //如果是数字，循环继续 
        while(i < str.length() && isNum(str.charAt(i))){
            int r = str.charAt(i) - '0';
            //判断在加上之后是否会越界
            if ((res > Integer.MAX_VALUE/10) || (res == Integer.MAX_VALUE/10 && r > 7)) {
                return flag > 0 ? Integer.MAX_VALUE : Integer.MIN_VALUE;
            }
            res = res *10 + r;
            i++;
        }
        return flag>0? res:-res;
    }
    //判断是不是数字
    private boolean isNum(char c){
        if(c - '0' >=0 && c - '9' <= 0) return true;
        else  return false; 
    }
}
```





### 0.10 [剑指 Offer 44. 数字序列中某一位的数字](https://leetcode-cn.com/problems/shu-zi-xu-lie-zhong-mou-yi-wei-de-shu-zi-lcof/)

数字以0123456789101112131415…的格式序列化到一个字符序列中。在这个序列中，第5位（从下标0开始计数）是5，第13位是1，第19位是4，等等。

请写一个函数，求任意第n位对应的数字。

```java
class Solution {
    public int findNthDigit(int n) {
        //特殊情况
       if(n<0) return 0;
	   else if(n>=0 && n<=9) return n; 
	   else {
           //防止越界
		   long m = n;
		   long temp = 0;
           //当前数字的长度
		   long base = 1;
           //当前数字的个数
		   long num = 9;
		   char res = '0';
           //当前占的位数，循环到包含第n位数字
		   while((temp+base*num) < m) {
               //长度
			   temp += base*num;
               //数字长度加一
			   base += 1;
               //长度为base的数字个数
			   num *= 10;
		   }
           //a用来确定所在数字的大小
		   long a = (m-temp)/base;
           //b用来确定在这个数字的第几位
		   long b = (m-temp)%base;
           
		   if(b!=0) {
               //计算出这个数
			   long c = (long) (Math.pow(10, base-1) + a);
               //找到答案
			   res = String.valueOf(c).charAt((int)b-1);
            //b=0，说明是在前一个数的最后一位上
		   }else {
			   long c = (long) (Math.pow(10, base-1) + a - 1);
			   res = String.valueOf(c).charAt((int)base-1);
		   }
		   return Integer.parseInt(String.valueOf(res));
	   }
    }
}
```





### 0.11 无重复的最长子串

```java
//双指针，如果已经包含就不断前移
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int n = s.length();
        Set<Character> set = new HashSet<>();
        int res = 0,i = 0,j = 0;
        while(i < n && j < n){
            if(!set.contains(s.charAt(j))){
                set.add(s.charAt(j));
                j++;
                res = Math.max(res,j-i);
            }else{
                set.remove(s.charAt(i));
                i++;
            }
        }
        return res;
    }
}
//定义一个 map 数据结构存储 (k, v)，其中 key 值为字符，value 值为字符位置 +1，加 1 表示从字符位置后一个才开始不重复
//我们定义不重复子串的开始位置为 start，结束位置为 end
//随着 end 不断遍历向后，会遇到与 [start, end] 区间内字符相同的情况，此时将字符作为 key 值，获取其 value 值，并更新 start，此时 [start, end] 区间内不存在重复字符
//无论是否更新 start，都会更新其 map 数据结构和结果 ans。
//时间复杂度：O(n)
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int n = s.length();
        int res = 0;
        Map<Character,Integer> map = new HashMap<>();
        for(int right = 0 ,left = 0; right < n ;right++){
            if(map.containsKey(s.charAt(right))){
                left = Math.max(map.get(s.charAt(right)),left);  
            }
            res = Math.max(res,right-left+1);
            map.put(s.charAt(right),right+1);  		//加一是为了返回重复字符的后一位
        }
        return res;
    }
}
```

### 0.12 最小覆盖子串

```java
public static String minWindow(String s, String t) {
        if (s == null || s == "" || t == null || t == "" || s.length() < t.length()) {
            return "";
        }
        //用来统计t中每个字符出现次数  char型可以转换成0-128的int，对应字符的ASCII码,也就是用字符对应的int值作为下标
        int[] needs = new int[128];    //标记字符串t中字符
        
        int[] window = new int[128];  //标记滑动窗口中的字符

        for (int i = 0; i < t.length(); i++) {	//加入数组中
            needs[t.charAt(i)]++;
        }

        int left = 0;
        int right = 0;

        String res = "";

        
        int count = 0;		//当前有多少个字符匹配成功

        //用来记录最短需要多少个字符。
        int minLength = s.length() + 1;

        while (right < s.length()) {
            char ch = s.charAt(right);	
            window[ch]++;	
            if (needs[ch] > 0 && needs[ch] >= window[ch]) {	//如果字符匹配成功，count++
                count++;
            }

            while (count == t.length()) {		//当匹配整个字符串都匹配成功，记录下当前的最短覆盖子串，然后从左侧缩小窗口，如果最左是有效的字符，右移右侧的指针直到再次匹配成功
                ch = s.charAt(left);	
                if (needs[ch] > 0 && needs[ch] >= window[ch]) {	//如果最左的元素属于有效字符，减少count
                    count--;
                }
                if (right - left + 1 < minLength) {		//如果当前窗口的大小小于最短，更新minlength
                    minLength = right - left + 1;
                    res = s.substring(left, right + 1);		//截取当前最短的子串作为答案

                }
                window[ch]--;	//将最左元素从窗口中去除
                left++;		//左指针右移

            }
            right++;	//右指针右移

        }
        return res;
    }
```



### 0.13 [剑指 Offer 57 - II. 和为s的连续正数序列](https://leetcode-cn.com/problems/he-wei-sde-lian-xu-zheng-shu-xu-lie-lcof/)

输入一个正整数 target ，输出所有和为 target 的连续正整数序列（至少含有两个数）。

序列内的数字由小到大排列，不同序列按照首个数字从小到大排列。

```java
class Solution {
    public int[][] findContinuousSequence(int target) {
        //左右边界
        int i = 1, j = 0;
        int sum = 0;
        List<int[]> res = new ArrayList<>();
    
        while(i <= target / 2){
            //如果和小于目标，右边界右移
            if(sum < target){
                sum += j;
                j++;
            //如果和大于目标，左边界右移
            }else if(sum > target){
                sum -= i;
                i++;
            //否则，将答案加入
            }else{
                int[] a = new int[j-i];
                for(int k = i ; k < j; k++){
                    a[k - i] = k;
                }
                res.add(a);
                //以i为起点已经没有答案了，左边界右移
                sum -= i;
                i++;
            }
        }
        return res.toArray(new int[res.size()][] );
    }
}
```



### 0.14 [剑指 Offer 59 - I. 滑动窗口的最大值](https://leetcode-cn.com/problems/hua-dong-chuang-kou-de-zui-da-zhi-lcof/)

给定一个数组 `nums` 和滑动窗口的大小 `k`，请找出所有滑动窗口里的最大值。

思路：怎么样在每次窗口滑动后在O(1)的时间获得最大值-----单调队列，队列头就是最大的元素

```java
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if(nums.length == 0 || k == 0) return new int[0];
        //维护一个单调递减的双端队列
        Deque<Integer> deque = new LinkedList<>();
        int[] res = new int[nums.length - k + 1];
        for(int j = 0,i = 1-k ; j < nums.length ; i++,j++){
            //如果窗口已经成型，并且滑动时移除的是最大值
            if(i > 0 && deque.peekFirst() == nums[i-1]){
                deque.removeFirst();
            }
            //移除队列中所有小于新加入的值
            while(!deque.isEmpty() && deque.peekLast() < nums[j]){
                deque.removeLast();
            }
            //加入队列
            deque.add(nums[j]);
            //记录最大值
            if(i >= 0){
                res[i] = deque.peekFirst();
            }
        }
        return res;
    }
}
```

