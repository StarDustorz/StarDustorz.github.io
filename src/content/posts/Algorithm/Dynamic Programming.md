---
title: "[Algorithm] Dynamic Programming"
published: 2021-06-12
tags:
  - Algorithm
lang: zh
toc: true
abbrlink: algorithm-dynamic-programming
---
<!--more-->
# 动态规划

### 0.1 1、思考状态

- 状态的定义：题目问什么，把什么设置成状态
- 思考状态怎么转移，如果不好转移，尝试修改定义
- 状态转移方程：大问题的最优解怎么从小问题的最优解得到

### 0.2 2、思考状态转移方程

- 推导技巧：分类讨论。即：对状态空间进行分类
- 「动态规划」方法依然是「空间换时间」思想的体现，常见的解决问题的过程很像在「填表」

### 0.3 3、思考初始化

- 角度 1：直接从状态的语义出发；
- 角度 2：如果状态的语义不好思考，就考虑「状态转移方程」的边界需要什么样初始化的条件；
- 角度 3：从「状态转移方程」方程的下标看是否需要多设置一行、一列表示「哨兵」（sentinel），这样可以避免一些特殊情况的讨论。

### 0.4 4、思考输出

有些时候是最后一个状态，有些时候可能会综合之前所有计算过的状态。

### 0.5 5、思考优化空间（也可以叫做表格复用）

- 「优化空间」会使得代码难于理解，且是的「状态」丢失原来的语义，初学的时候可以不一步到位。先把代码写正确是更重要；
- 「优化空间」在有一种情况下是很有必要的，那就是状态空间非常庞大的时候（处理海量数据），此时空间不够用，就必须「优化空间」；
- 非常经典的「优化空间」的典型问题是「0-1 背包」问题和「完全背包」问题。



## 1 斐波那契数列

### 1.1 70.爬楼梯

假设你正在爬楼梯。需要 n 阶你才能到达楼顶。每次你可以爬 1 或 2 个台阶。你有多少种不同的方法可以爬到楼顶呢？

注意：给定 n 是一个正整数。

```java
//思路：第i个楼梯可以从i-1或者i-2处再走一步到达；那么dp[i] = dp[i-1] + dp[i-2]
//又因为只和前两步有关，可以用两个变量存储之前的状态，降低时间复杂度
class Solution {
    public int climbStairs(int n) {
        if(n <= 2) return n;
        int pre1 = 1,pre2 = 2;  //初始状态
        for(int i = 2;i < n;i++){
            int cur = pre1 + pre2;	//当前为前两级的和
            pre1 = pre2;	//都前进一步
            pre2 = cur;
        }
        return pre2;
    }
}
```

### 1.2 198.强盗打劫

你是一个专业的小偷，计划偷窃沿街的房屋。每间房内都藏有一定的现金，影响你偷窃的唯一制约因素就是相邻的房屋装有相互连通的防盗系统，如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警。

```java
//思路：定义 dp 数组用来存储最大的抢劫量，其中 dp[i] 表示抢到第 i 个住户时的最大抢劫量。
//状态转移方程：dp[i] = Math.max(dp[i-2] + nums[i],dp[i-1]) 
class Solution {
    public int rob(int[] nums) {
        int pre1 = 0,pre2 = 0, cur = 0;
        for(int i = 0; i < nums.length ; i++){
            cur = Math.max(nums[i] + pre1 , pre2);
            pre1 = pre2;
            pre2 = cur;
        }
        return cur;
    }
}
```

### 1.3 213.强盗在环型街道打劫

你是一个专业的小偷，计划偷窃沿街的房屋，每间房内都藏有一定的现金。这个地方所有的房屋都围成一圈，这意味着第一个房屋和最后一个房屋是紧挨着的。同时，相邻的房屋装有相互连通的防盗系统，如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警。

```java
//思路：在打家劫舍的基础上限定了范围，也就是打劫的第一家和最后一家不能相邻[0,n-2] [1,n-1]
//状态转移方程dp[i] = Math.max(dp[i-2] + nums[i],dp[i-1]) 
//通过新建打劫方法对范围进行限定和比较
class Solution {
    public int rob(int[] nums) {
        //抢劫的第一家和最后一家不能相邻[1,n-1] [0,n-2]
        int n = nums.length;
        if(n == 0) return 0;
        if(n == 1) return nums[0];
        return Math.max(robHelper(nums,1,n-1),robHelper(nums,0,n-2)); //两种不同的打劫方法
    }
    private int robHelper(int[] nums,int start,int end){
        int pre1 = 0,pre2=0,cur=0;
        for(int i = start;i<=end;i++){
            cur = Math.max(pre1 + nums[i] , pre2);
            pre1 = pre2;
            pre2 = cur;
        }
        return cur;
    }
}
```

### 1.4 信件错排

题目描述：有 N 个 信 和 信封，它们被打乱，求错误装信方式的数量。

```java
//思路：定义一个数组 dp 存储错误方式数量，dp[i] 表示前 i 个信和信封的错误方式数量。假设第 i 个信装到第 j 个信封里面，而第 j 个信装到第 k 个信封里面。根据 i 和 k 是否相等，有两种情况：
// i==k，交换 i 和 j 的信后，它们的信和信封在正确的位置，但是其余 i-2 封信有 dp[i-2] 种错误装信的方式。由于 j 有 i-1 种取值，因此共有 (i-1)*dp[i-2] 种错误装信方式。
// i != k，交换 i 和 j 的信后，第 i 个信和信封在正确的位置，其余 i-1 封信有 dp[i-1] 种错误装信方式。由于 j 有 i-1 种取值，因此共有 (i-1)*dp[i-1] 种错误装信方式。
dp[i] = (i-1)*dp[i-2] + (i-1)*dp[i-1]
```

### 1.5 母牛生产

题目描述：假设农场中成熟的母牛每年都会生 1 头小母牛，并且永远不会死。第一年有 1 只小母牛，从第二年开始，母牛开始生小母牛。每只小母牛 3 年之后成熟又可以生小母牛。给定整数 N，求 N 年后牛的数量。

```java
dp[i] = dp[i-1] + dp[i-3]
```



## 2 矩阵路径

### 2.1 64.矩阵的最小路径和

给定一个包含非负整数的 m x n 网格，请找出一条从左上角到右下角的路径，使得路径上的数字总和为最小。

```java
//当前的状态只能从左或者上到达
//状态转移方程dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j]
//考虑边界，在最左时不可能从左来，在最上时，不可能从上来
class Solution {
    public int minPathSum(int[][] grid) {
        for(int i = 0 ; i < grid.length ; i++){
            for(int j = 0; j < grid[0].length;j++){
                if(i == 0 && j == 0) continue;
                else if(i == 0) grid[i][j] = grid[i][j] + grid[i][j-1];
                else if(j == 0) grid[i][j] = grid[i][j] + grid[i-1][j];
                else grid[i][j] = grid[i][j] + Math.min(grid[i-1][j],grid[i][j-1]);
             }
        }
        return grid[grid.length - 1][grid[0].length - 1] ;
    }
}
```

### 2.2 62.矩阵的总路径数

一个机器人位于一个 m x n 网格的左上角 （起始点在下图中标记为“Start” ）。机器人每次只能向下或者向右移动一步。机器人试图达到网格的右下角（在下图中标记为“Finish”）。问总共有多少条不同的路径？

```java 
//dp[i][j] = dp[i-1][j] + dp[i][j-1]
//左边界和上边界都是1
class Solution {
    public int uniquePaths(int m, int n) {
        int[][] dp = new int[m][n];
        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++){
                if(i == 0 || j == 0) dp[i][j] = 1;
                else dp[i][j] = dp[i-1][j] + dp[i][j-1];
            } 

        return dp[m-1][n-1];
    }
}
```



## 3 0-1背包

有一个容量为 N 的背包，要用这个背包装下物品的价值最大，这些物品有两个属性：体积 w 和价值 v。

```java
//定义一个二维数组 dp 存储最大价值，其中 dp[i][j] 表示前 i 件物品体积不超过 j 的情况下能达到的最大价值。设第 i 件物品体积为 w，价值为 v，根据第 i 件物品是否添加到背包中，可以分两种情况讨论：
//第 i 件物品没添加到背包，总体积不超过 j 的前 i 件物品的最大价值就是总体积不超过 j 的前 i-1 件物品的最大价值，dp[i][j] = dp[i-1][j]。
//第 i 件物品添加到背包中，dp[i][j] = dp[i-1][j-w] + v。


//状态转移方程：dp[i][j] = max(dp[i-1][j], dp[i-1][j-w]+v)
// W 为背包总体积
// N 为物品数量
// weights 数组存储 N 个物品的重量
// values 数组存储 N 个物品的价值
public int knapsack(int W, int N, int[] weights, int[] values) {
    int[][] dp = new int[N + 1][W + 1];
    for (int i = 1; i <= N; i++) {
        int w = weights[i - 1], v = values[i - 1];
        for (int j = 1; j <= W; j++) {
            if (j >= w) {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w] + v);
            } else {
                dp[i][j] = dp[i - 1][j];
            }
        }
    }
    return dp[N][W];
}
```

### 3.1 空间优化

观察状态转移方程可以知道，前 i 件物品的状态仅与前 i-1 件物品的状态有关，因此可以将 dp 定义为一维数组

```java
//dp[i] = max(dp[j],dp[j-w]+v)
//因为 dp[j-w] 表示 dp[i-1][j-w]，因此不能先求 dp[i][j-w]，防止将 dp[i-1][j-w] 覆盖。也就是说要先计算 dp[i][j] 再计算 dp[i][j-w]，在程序实现时需要按倒序来循环求解。
public int knapsack(int W, int N, int[] weights, int[] values) {
    int[] dp = new int[W + 1];
    for (int i = 1; i <= N; i++) {
        int w = weights[i - 1], v = values[i - 1];
        for (int j = W; j >= 1; j--) {
            if (j >= w) {
                dp[j] = Math.max(dp[j], dp[j - w] + v);
            }
        }
    }
    return dp[W];
}
```

## 4 完全背包

### 4.1 322.找零钱的最少硬币数

给定不同面额的硬币 coins 和一个总金额 amount。编写一个函数来计算可以凑成总金额所需的最少的硬币个数。如果没有任何一种硬币组合能组成总金额，返回 -1。

```java
//状态转移方程：dp[amount] = Math.min({dp[amount - coin]|(for(int coin : coins))})
//也就是根据当前硬币的面值可以抵达的状态中的最小值

class Solution {
    public int coinChange(int[] coins, int amount) {
        if(amount == 0) return 0;
        int[] dp = new int[amount+1];
        for(int coin : coins){//对硬币面值进行遍历
            for(int i = coin; i < amount + 1; i++){
                //如果一个硬币就可以，置为一
                if(i == coin) dp[i] = 1;
                //如果减一个硬币就可以，在该状态基础上加一
                else if(dp[i] == 0 && dp[i-coin] != 0) dp[i] = dp[i-coin] + 1;
                //在遍历硬币的时候，如果发现更优解，重置结果
                else if(dp[i] != 0 && dp[i-coin] != 0) dp[i] = Math.min(dp[i], dp[i-coin]+1);
            }
        }
        return dp[amount] == 0 ? -1 : dp[amount];
    }
}
```

### 4.2 518.找零钱的硬币数组合

给定不同面额的硬币和一个总金额。写出函数来计算可以凑成总金额的硬币组合数。假设每一种面额的硬币有无限个。

```java
class Solution {
    public int change(int amount, int[] coins) {
        int[] dp = new int[amount+1];
        dp[0] = 1;
        for(int coin : coins){   //遍历硬币面值
            for(int i = coin; i < amount + 1; i++){
                dp[i] += dp[i-coin];  //终态是不同状态到达该状态的累加
            }
        }
        return dp[amount];
    }
}
```



## 5 数组区间

### 5.1 303.数组区间和

给定一个整数数组 nums，求出数组从索引 i 到 j (i ≤ j) 范围内元素的总和，包含 i, j 两点。

```java
//从i到j的区间和可以转化成前缀和之差
//构建一个数组，保存从0到下标处的数组和
class NumArray {
    private int[] sums;  //和数组
    public NumArray(int[] nums) {
        sums = new int[nums.length + 1];
        for(int i = 1 ; i <= nums.length;i++){
            sums[i] = sums[i-1] + nums[i-1];
        }
    }  
    public int sumRange(int i, int j) {
        return sums[j+1] - sums[i];
    }
}
```

### 5.2 413.等差数列划分

数组 A 包含 N 个数，且索引从0开始。数组 A 的一个子数组划分为数组 (P, Q)，P 与 Q 是整数且满足 0<=P<Q<N 。

如果满足以下条件，则称子数组(P, Q)为等差数组：

元素 A[P], A[p + 1], ..., A[Q - 1], A[Q] 是等差的。并且 P + 1 < Q 。

函数要返回数组 A 中所有为等差数组的子数组个数。

```java
//思路：dp[i]表示以A[i]结尾的等差递增子区间的个数
//当 A[i] - A[i-1] == A[i-1] - A[i-2]，那么 [A[i-2], A[i-1], A[i]] 构成一个等差递增子区间。而且在以 A[i-1] 为结尾的递增子区间的后面再加上一个 A[i]，一样可以构成新的递增子区间。
//也就是在 A[i] - A[i-1] == A[i-1] - A[i-2] 时，dp[i] = dp[i-1] + 1
class Solution {
    public int numberOfArithmeticSlices(int[] A) {
        int n = A.length;
        if(n < 3) return 0;
        int[] dp = new int[n];
        for(int i = 2; i < n; i++){
            if(A[i] - A[i-1] == A[i-1] - A[i-2]){	//从头到尾遍历数组
                dp[i] = dp[i-1] + 1;
            }
        }
        int total = 0;
        for(int cnt : dp){
            total += cnt;
        }
        return total;
    }
}

```



## 6 分割整数

### 6.1 分割整数的最大乘积

给定一个正整数 n，将其拆分为至少两个正整数的和，并使这些整数的乘积最大化。 返回你可以获得的最大乘积

```java
//状态转移方程： dp[i] = Math.max(dp[i], Math.max(j*dp[i-j], j*(i-j)))
//和自己比，和不同切的方式比，留下最大值
class Solution {
    public int integerBreak(int n) {
        int[] dp = new int[n+1];
        dp[1] = 1;
        for(int i = 2; i <= n; i++)
            for(int j = 1; j < i; j++){
                dp[i] = Math.max(dp[i], Math.max(j*dp[i-j], j*(i-j)));
            }
        return dp[n];
    }
}
```



## 7 最长上升子序列

给定一个无序的整数数组，找到其中最长上升子序列的长度。

```java
//思路：动态规划 dp[i]存储当前的最大上升子序列，遍历前序dp，如果大于则dp[j]+1
class Solution {
    public int lengthOfLIS(int[] nums) {
        if(nums.length == 0) return 0;
        int n = nums.length;
        int[] dp = new int[n];
        for(int i = 0; i < n; i++){		//遍历整数数组
            int max = 1;
            for(int j = 0; j < i; j++){		//计算当前最大上升子序列
                if(nums[i] > nums[j]){		//如果当前值比前面遍历到的大，最大上升子序列加一
                    max = Math.max(max, dp[j] + 1);
                }
            }
            dp[i] = max;
        }
        int result = 0;
        for(int ret : dp){
            result = Math.max(ret, result);   //找出dp数组中的最大
        }
        return result;
    }
}

```



### 7.1 [剑指 Offer 46. 把数字翻译成字符串](https://leetcode-cn.com/problems/ba-shu-zi-fan-yi-cheng-zi-fu-chuan-lcof/)

给定一个数字，我们按照如下规则把它翻译为字符串：0 翻译成 “a” ，1 翻译成 “b”，……，11 翻译成 “l”，……，25 翻译成 “z”。一个数字可能有多个翻译。请编程实现一个函数，用来计算一个数字有多少种不同的翻译方法。

```java
class Solution {
    public int translateNum(int num) {
        String s = String.valueOf(num);
        //dp[i-2] = b; dp[i-1] = a; dp[i] = c 
        //对于一个字符串，如果最后两位可以被翻译，那么
        //dp[i] = dp[i-1] + dp[i-2]
        //否则dp[i] = dp[i-1]
        int a = 1, b = 1;
        //从左往右递推
        for(int i = 2; i <= s.length(); i++) {
            String tmp = s.substring(i - 2, i);
            int c = tmp.compareTo("10") >= 0 && tmp.compareTo("25") <= 0 ? a + b : a;
            b = a;
            a = c;
        }
        return a;
    }
}
```



## 8 字符串相关

### 8.1 [72. 编辑距离](https://leetcode-cn.com/problems/edit-distance/)

给你两个单词 word1 和 word2，请你计算出将 word1 转换成 word2 所使用的最少操作数 。

你可以对一个单词进行如下三种操作：

插入一个字符
删除一个字符
替换一个字符

```java
//dp[i][j]: word1中前i个单词变换到word2中前j个单词需要的最短操作次数
//考虑某一个单词是空的
//状态转移：
//增：dp[i][j] = dp[i][j-1] + 1
//删：dp[i][j] = dp[i-1][j] + 1
//改：dp[i][j] = dp[i-1][j-1] + 1
public class Solution {
    public int minDistance(String word1, String word2) {
        int len1 = word1.length();
        int len2 = word2.length();
        // 多开一行一列是为了保存边界条件，即字符长度为 0 的情况，这一点在字符串的动态规划问题中比较常见
        int[][] dp = new int[len1 + 1][len2 + 1];
        // 初始化：当 word2 长度为 0 时，将 word1 的全部删除即可
        for (int i = 1; i <= len1; i++) {
            dp[i][0] = i;
        }
        // 当 word1 长度为 0 时，插入所有 word2 的字符即可
        for (int j = 1; j <= len2; j++) {
            dp[0][j] = j;
        } 
        // 由于 word1.charAt(i) 操作会去检查下标是否越界，因此在 Java 里，将字符串转换成字符数组是常见额操作
        char[] word1Array = word1.toCharArray();
        char[] word2Array = word2.toCharArray();
        // 递推开始，注意：填写 dp 数组的时候，由于初始化多设置了一行一列，横纵坐标有个偏移
        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                // 这是最佳情况
                // 多开了一行，所以是 i-1 和 j-1
                if (word1Array[i - 1] == word2Array[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                    continue;
                }
                // 否则在以下三种情况中选出步骤最少的，这是「动态规划」的「最优子结构」
                // 1、在下标 i 处插入一个字符
                int insert = dp[i][j - 1] + 1;
                // 2、替换一个字符
                int replace = dp[i - 1][j - 1] + 1;
                // 3、删除一个字符
                int delete = dp[i - 1][j] + 1;
                dp[i][j] = Math.min(Math.min(insert, replace), delete);
            }
        }
        return dp[len1][len2];
    }
}

```



### 8.2 [5. 最长回文子串](https://leetcode-cn.com/problems/longest-palindromic-substring/)

给你一个字符串 `s`，找到 `s` 中最长的回文子串。

```java
//定义状态 dp[i][j] 表示从 i 到 j 的字串是不是回文的
//状态转移方程 ：dp[i][j] = ( s[j] == s[j] ) && dp[i+1][j-1]
//或者 j - i < 3 的情况下 s[j] == s[j]
//初始化dp[i][i] = true


class Solution {
    public String longestPalindrome(String s) {
        int len = s.length();
        if(len < 2){
            return s;
        }
        //记录最大长度
        int maxLen = 0;
        //记录开始
        int start = 0;
        //表示从i到j是不是回文串
        boolean[][] dp = new boolean[len][len];
        char[] charArray = s.toCharArray();
        //初始化
        for(int i = 0 ; i < len; i++){
            dp[i][i] = true;
        }
        for(int j = 1; j < len; j++){
            for(int i = 0; i < j; i++){
                if(charArray[i] != charArray[j]){
                    dp[i][j] = false;
                }else{
                    if(j - i < 3){
                        dp[i][j] = true;
                    }else{
                        dp[i][j] = dp[i + 1][j - 1];
                    }
                }
            if(dp[i][j] && j - i + 1 > maxLen){
                maxLen = j - i + 1;
                start = i;
            }
          }
        }
        return s.substring(start,start+maxLen);
    }
}
```

