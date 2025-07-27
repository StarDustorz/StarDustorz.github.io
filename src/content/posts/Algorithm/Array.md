---
title: '[Algorithm] Array'
published: 2021-06-12
tags:
  - Algorithm
lang: zh
toc: true
abbrlink: algorithm-array
---


<!--more-->

## 1 声明和定义

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

## 2 [11. 盛最多水的容器](https://leetcode-cn.com/problems/container-with-most-water/)

给你 n 个非负整数 a1，a2，...，an，每个数代表坐标中的一个点 (i, ai) 。在坐标内画 n 条垂直线，垂直线 i 的两个端点分别为 (i, ai) 和 (i, 0) 。找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水。

```java
//双指针，每次移动较短的那个边
class Solution {
    public int maxArea(int[] height) {
        int ans = 0;
        for(int i = 0, j = height.length - 1; i < j; ){
            int min = height[i] < height[j] ? height[i++] : height[j--];
            ans = Math.max(ans, (j-i+1) * min);
        }
        return ans;
    }
}
```



## 3 [15. 三数之和](https://leetcode-cn.com/problems/3sum/)

给你一个包含 n 个整数的数组 nums，判断 nums 中是否存在三个元素 a，b，c ，使得 a + b + c = 0 ？请你找出所有和为 0 且不重复的三元组。

注意：答案中不可以包含重复的三元组。

```java
class Solution {
    public static List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> ans = new ArrayList();
        int len = nums.length;
        if(nums == null || len < 3) return ans;
        Arrays.sort(nums); // 排序
        for (int i = 0; i < len ; i++) {
            if(nums[i] > 0) break; // 如果当前数字大于0，则三数之和一定大于0，所以结束循环
            if(i > 0 && nums[i] == nums[i-1]) continue; // 去重
            int L = i+1;
            int R = len-1;
            while(L < R){
                int sum = nums[i] + nums[L] + nums[R];
                if(sum == 0){
                    ans.add(Arrays.asList(nums[i],nums[L],nums[R]));
                    while (L<R && nums[L] == nums[L+1]) L++; // 去重
                    while (L<R && nums[R] == nums[R-1]) R--; // 去重
                    L++;
                    R--;
                }
                else if (sum < 0) L++;
                else if (sum > 0) R--;
            }
        }        
        return ans;
    }
}
```



## 4 [33. 搜索旋转排序数组](https://leetcode-cn.com/problems/search-in-rotated-sorted-array/)

整数数组 nums 按升序排列，数组中的值 互不相同 。

在传递给函数之前，nums 在预先未知的某个下标 k（0 <= k < nums.length）上进行了 旋转，使数组变为 [nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]（下标 从 0 开始 计数）。例如， [0,1,2,4,5,6,7] 在下标 3 处经旋转后可能变为 [4,5,6,7,0,1,2] 。

给你 旋转后 的数组 nums 和一个整数 target ，如果 nums 中存在这个目标值 target ，则返回它的索引，否则返回 -1 。

```java
class Solution {
    public int search(int[] nums, int target) {
        int len = nums.length;
        int left = 0, right = len - 1;
        while(left <= right){
            int mid = (left + right) / 2;
            if(nums[mid] == target) return mid;
            //第一步，找出哪个半区是有序的，然后判断是不是在这个半区里面，缩小范围
            else if(nums[mid] < nums[right]){
                if(nums[mid] < target && target <= nums[right]){
                    left = mid + 1;
                }else{
                    right = mid - 1;
                }
            }else{
                if (nums[left] <= target && target < nums[mid])
                    right = mid - 1;
                else 
                    left = mid + 1;
            }
        }
        return -1;
    }
}
```



## 5 [38. 外观数列](https://leetcode-cn.com/problems/count-and-say/)

要 描述 一个数字字符串，首先要将字符串分割为 最小 数量的组，每个组都由连续的最多 相同字符 组成。然后对于每个组，先描述字符的数量，然后描述字符，形成一个描述组。要将描述转换为数字字符串，先将每组中的字符数量用数字替换，再将所有描述组连接起来。

```java
class Solution {
    public String countAndSay(int n) {
        if (n == 1) {
            return "1";
        }
        //第一个外观数列
        String str = "1";
        //迭代出第n个外观数列
        for (int i = 0; i < n - 1; i++) {
            StringBuffer sb = new StringBuffer();
            //计数，有几个这样的
            int count = 0;
            //第一个字符，计数的开始
            char code = str.charAt(0);
            //遍历整个字符串
            for (int j = 0; j < str.length(); j++) {
                //如果碰到不一样的，将之前的字符数量和字符加入
                if (str.charAt(j) != code) {
                    sb.append(count);
                    sb.append(code);
                    //重新计算下一个字符
                    code = str.charAt(j);
                    count = 1;
                } else {
                    count++;
                }
            }
            sb.append(count);
            sb.append(str.charAt(str.length() - 1));
            str = sb.toString();
        }
        return str;
    }
}
```



## 6 [42. 接雨水](https://leetcode-cn.com/problems/trapping-rain-water/)

给定 *n* 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

```java
class Solution {
    public int trap(int[] height) {
        int min = 0, max = 0;
        int l = 0, r = height.length - 1;
        int res = 0;
        while(l < r) {
            // 双指针维护最小值,这个表示的是当前扫描到的可能存雨水的底的高度
            min = height[height[l] < height[r] ? l++ : r--];
            // max等于水位线
            max = Math.max(max, min);
            // 累加差值
            res += max - min;
        }
        return res;
    }
}
```







## 7 寻找数组的中心索引

题目：给定一个整数类型的数组 nums，请编写一个能够返回数组 “中心索引” 的方法。

我们是这样定义数组 中心索引 的：数组中心索引的左侧所有元素相加的和等于右侧所有元素相加的和。

如果数组不存在中心索引，那么我们应该返回 -1。如果数组有多个中心索引，那么我们应该返回最靠近左边的那一个。

输入：
nums = [1, 7, 3, 6, 5, 6]
输出：3
解释：
索引 3 (nums[3] = 6) 的左侧数之和 (1 + 7 + 3 = 11)，与右侧数之和 (5 + 6 = 11) 相等。
同时, 3 也是第一个符合要求的中心索引。

思路：前缀和


```java
    int sum = 0,leftsum = 0;
    for(int i=0;i<nums.length;i++){
        sum += nums[i];
    }
    for(int i = 0;i < nums.length;i++){
        if(leftsum*2 == sum - nums[i]){
            return i;}
        leftsum += nums[i];
    }
    return -1;
```

## 8 搜索插入位置

题目：给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。如果目标值不存在于数组中，返回它将会被按顺序插入的位置。

你可以假设数组中无重复元素。

思路：二分查找相等直接返回，大于mid则left=mid+1；否则right=mid-1；




```java
    if (nums == null || nums.length == 0) {
        return 0;
    }
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        }
        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return left;
}
```


## 9 合并区间

题目：给出一个区间的集合，请合并所有重叠的区间。

输入: [[1,3],[2,6],[8,10],[15,18]]
输出: [[1,6],[8,10],[15,18]]
解释: 区间 [1,3] 和 [2,6] 重叠, 将它们合并为 [1,6].

思路：按照左端点升序排序，然后遍历。

如果当前遍历到的区间的左端点 > 结果集中最后一个区间的右端点，说明它们没有交集，此时把区间添加到结果集；
如果当前遍历到的区间的左端点 <= 结果集中最后一个区间的右端点，说明它们有交集，此时产生合并操作，即：对结果集中最后一个区间的右端点更新（取两个区间的最大值）。


```java
    int len = intervals.length;
    if (len < 2) {
        return intervals;
    }
    
    // 按照起点排序
    Arrays.sort(intervals,Comparator.comparing  Int(o -> o[0]));
    List<int[]> res = new ArrayList<>();
    res.add(intervals[0]);
    for (int i = 1; i < len; i++) {
        int[] curInterval = intervals[i];
        // 每次新遍历到的列表与当前结果集中的最后一个区间的末尾端点进行比较
        int[] peek = res.get(res.size() - 1);
        if (curInterval[0] > peek[1]) {
            res.add(curInterval);
        } else {
            peek[1] = Math.max(curInterval[1], peek[1]);
        }
    }
    return res.toArray(new int[res.size()][]);
```



## 10 最大子序和(1385)

[https://leetcode-cn.com/problems/maximum-subarray/](https://leetcode-cn.com/problems/maximum-subarray/)

```html
给定一个整数数组 nums ，找到一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。
```

```html
输入: [-2,1,-3,4,-1,2,1,-5,4],
输出: 6
解释: 连续子数组 [4,-1,2,1] 的和最大，为 6。
```

```java
class Solution {
    public int maxSubArray(int[] nums) {
        if (nums == null || nums.length == 0) return 0;
        int preSum = nums[0];
        int maxSum = preSum;
        for (int i = 1; i < nums.length; i++) {
            // 注意条件
            preSum = preSum > 0 ? preSum + nums[i] : nums[i];
            maxSum = Math.max(maxSum, preSum);
        }
        return maxSum;
    }
}
```

## 11 打家劫舍 II(375)

[https://leetcode-cn.com/problems/house-robber-ii/](https://leetcode-cn.com/problems/house-robber-ii/)

```html
你是一个专业的小偷，计划偷窃沿街的房屋，每间房内都藏有一定的现金。这个地方所有的房屋都围成一圈，这意味着第一个房屋和最后一个房屋是紧挨着的。同时，相邻的房屋装有相互连通的防盗系统，如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警。

给定一个代表每个房屋存放金额的非负整数数组，计算你在不触动警报装置的情况下，能够偷窃到的最高金额。

输入: [2,3,2]
输出: 3
解释: 你不能先偷窃 1 号房屋（金额 = 2），然后偷窃 3 号房屋（金额 = 2）, 因为他们是相邻的。

输入: [1,2,3,1]
输出: 4
解释: 你可以先偷窃 1 号房屋（金额 = 1），然后偷窃 3 号房屋（金额 = 3）。
     偷窃到的最高金额 = 1 + 3 = 4 。

```

```java
class Solution {
    public int rob(int[] nums) {
        if (nums == null || nums.length == 0) return 0;
        int n = nums.length;
        if (n == 1) return nums[0];
        return Math.max(rob(nums, 0, n - 2), rob(nums, 1, n - 1));
    }

    private int rob(int[] nums, int first, int last) {
        int pre2 = 0, pre1 = 0;
        for (int i = first; i <= last; i++) {
            int cur = Math.max(pre1, pre2 + nums[i]);
            pre2 = pre1;
            pre1 = cur;
        }
        return pre1;
    }
}
```

## 12 搜索插入位置(1239)

[https://leetcode-cn.com/problems/search-insert-position/](https://leetcode-cn.com/problems/search-insert-position/)

```html
给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。如果目标值不存在于数组中，返回它将会被按顺序插入的位置。

你可以假设数组中无重复元素。
```

```html
输入: [1,3,5,6], 5
输出: 2
输入: [1,3,5,6], 2
输出: 1
输入: [1,3,5,6], 7
输出: 4
输入: [1,3,5,6], 0
输出: 0
```

二分法
但要考虑边界

```java
class Solution {
    public int searchInsert(int[] nums, int target) {
        int l = 0;
        int h = nums.length - 1;
        while (l <= h) {
            int mid = l + (h - l) / 2;
            if (nums[mid] < target) 
                l = mid + 1;
            else if (nums[mid] > target) 
                h = mid - 1;
            else 
                return mid;
        }
        // 注意边界
        if (h < 0 && l == 0) 
            return (l + h) % 2 + 1;
        else 
            return (l + h) / 2 + 1;
    }
}
```

## 13 接雨水(1145)

[https://leetcode-cn.com/problems/trapping-rain-water/](https://leetcode-cn.com/problems/trapping-rain-water/)

双指针

```java
class Solution {
    public int trap(int[] height) {
        int min = 0, max = 0;
        int l = 0, r = height.length - 1;
        int res = 0;
        while(l < r) {
            // 双指针维护最小值
            min = height[height[l] < height[r] ? l++ : r--];
            // 接着维护最大值
            max = Math.max(max, min);
            // 累加差值
            res += max - min;
        }
        return res;
    }
}
```

## 14 跳跃游戏(1059)

[https://leetcode-cn.com/problems/jump-game/](https://leetcode-cn.com/problems/jump-game/)

```html
给定一个非负整数数组，你最初位于数组的第一个位置。

数组中的每个元素代表你在该位置可以跳跃的最大长度。

判断你是否能够到达最后一个位置。
```

```html
输入: [2,3,1,1,4]
输出: true
解释: 我们可以先跳 1 步，从位置 0 到达 位置 1, 然后再从位置 1 跳 3 步到达最后一个位置。

输入: [3,2,1,0,4]
输出: false
解释: 无论怎样，你总会到达索引为 3 的位置。但该位置的最大跳跃长度是 0 ， 所以你永远不可能到达最后一个位置。
```

贪心

```java
class Solution {
    public boolean canJump(int[] nums) {
        if (nums.length <= 1) return true;
        int n = nums.length;
        int max = nums[0];
        for (int i = 1; i < n - 1; i++) {
            // 注意条件
            if (i <= max) {
                // 最远索引
                max = Math.max(max, nums[i] + i);
            } else {
                break;
            }
        }
        // 注意判断
        return max >= n - 1;
    }
}
```

## 15 加一(1254)

[https://leetcode-cn.com/problems/plus-one/](https://leetcode-cn.com/problems/plus-one/)

```html
给定一个由整数组成的非空数组所表示的非负整数，在该数的基础上加一。

最高位数字存放在数组的首位， 数组中每个元素只存储单个数字。

你可以假设除了整数 0 之外，这个整数不会以零开头。
```

```html
输入: [1,2,3]
输出: [1,2,4]
解释: 输入数组表示数字 123。

输入: [4,3,2,1]
输出: [4,3,2,2]
解释: 输入数组表示数字 4321。
```

正常操作
加法中常用
a = x % 10
b = x / 10

```java
class Solution {
    public int[] plusOne(int[] digits) {
        int length = digits.length;
        int[] res = new int[length + 1];
        int carry = 1;
        for (int i = length - 1; i >= 0 ; i--) {
            int sums = digits[i] + carry;
            res[i] = sums % 10;
            carry = sums / 10;
        }
        if (carry == 1) {
            res[0] = 1;
            return res;
        }
        return Arrays.copyOfRange(res,0,length);

    }
}
```

## 16 合并两个有序数组(1057)

[https://leetcode-cn.com/problems/merge-sorted-array/](https://leetcode-cn.com/problems/merge-sorted-array/)

```html
给你两个有序整数数组 nums1 和 nums2，请你将 nums2 合并到 nums1 中，使 nums1 成为一个有序数组。
说明:

初始化 nums1 和 nums2 的元素数量分别为 m 和 n 。
你可以假设 nums1 有足够的空间（空间大小大于或等于 m + n）来保存 nums2 中的元素。

```

```html
输入:
nums1 = [1,2,3,0,0,0], m = 3
nums2 = [2,5,6],       n = 3

输出: [1,2,2,3,5,6]
```

三指针

```java
public void merge(int[] nums1, int m, int[] nums2, int n) {
    int index1 = m - 1, index2 = n - 1;
    int indexMerge = m + n - 1;
    while (index1 >= 0 || index2 >= 0) {
        if (index1 < 0) {
            nums1[indexMerge--] = nums2[index2--];
        } else if (index2 < 0) {
            nums1[indexMerge--] = nums1[index1--];
        } else if (nums1[index1] > nums2[index2]) {
            nums1[indexMerge--] = nums1[index1--];
        } else {
            nums1[indexMerge--] = nums2[index2--];
        }
    }
}

```

## 17 买卖股票的最佳时机(1491)

[https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock/](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock/)

```html
给定一个数组，它的第 i 个元素是一支给定股票第 i 天的价格。

如果你最多只允许完成一笔交易（即买入和卖出一支股票一次），设计一个算法来计算你所能获取的最大利润。

注意：你不能在买入股票前卖出股票。
```

```html
输入: [7,1,5,3,6,4]
输出: 5
解释: 在第 2 天（股票价格 = 1）的时候买入，在第 5 天（股票价格 = 6）的时候卖出，最大利润 = 6-1 = 5 。
     注意利润不能是 7-1 = 6, 因为卖出价格需要大于买入价格；同时，你不能在买入前卖出股票

输入: [7,6,4,3,1]
输出: 0
解释: 在这种情况下, 没有交易完成, 所以最大利润为 0。
```

```java
class Solution {
    public int maxProfit(int[] prices) {
        // 边界
        if(prices.length == 0) return 0;
        // 长度
        int n = prices.length;
        // min
        int min = prices[0];
        // max
        int max = 0;
        for (int i = 1; i < n; i++) {
            // 一直找最小的股
            min = prices[i] < min ? prices[i] : min;
            // 遍历一圈，存最大的利润
            max = Math.max(max, prices[i] - min);
        }
        return max;
    }
}
```

## 18 多数元素(1096)

## 19 多数元素(1096)

[https://leetcode-cn.com/problems/majority-element/](https://leetcode-cn.com/problems/majority-element/)

```html
给定一个大小为 n 的数组，找到其中的多数元素。多数元素是指在数组中出现次数大于 ⌊ n/2 ⌋ 的元素。

你可以假设数组是非空的，并且给定的数组总是存在多数元素。

```

```html
输入: [3,2,3]
输出: 3
```

```java
class Solution {
    public int majorityElement(int[] nums) {
        Arrays.sort(nums);
        return nums[nums.length / 2];
    }
}
```

## 20 打家劫舍(1035)

[https://leetcode-cn.com/problems/house-robber/](https://leetcode-cn.com/problems/house-robber/)


```html
你是一个专业的小偷，计划偷窃沿街的房屋。每间房内都藏有一定的现金，影响你偷窃的唯一制约因素就是相邻的房屋装有相互连通的防盗系统，如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警。

给定一个代表每个房屋存放金额的非负整数数组，计算你 不触动警报装置的情况下 ，一夜之内能够偷窃到的最高金额。
```

```html
输入：[1,2,3,1]
输出：4
解释：偷窃 1 号房屋 (金额 = 1) ，然后偷窃 3 号房屋 (金额 = 3)。
     偷窃到的最高金额 = 1 + 3 = 4 。

输入：[2,7,9,3,1]
输出：12
解释：偷窃 1 号房屋 (金额 = 2), 偷窃 3 号房屋 (金额 = 9)，接着偷窃 5 号房屋 (金额 = 1)。
     偷窃到的最高金额 = 2 + 9 + 1 = 12 。
```

```java
class Solution {
    public int rob(int[] nums) {
        int pre2 = 0, pre1 = 0;
        for (int i = 0; i < nums.length; i++) {
            int cur = Math.max(pre2 + nums[i], pre1);
            pre2 = pre1;
            pre1 = cur;
        }
        return pre1;
    }
}
```



## 21 移动零(1008)

[https://leetcode-cn.com/problems/move-zeroes/](https://leetcode-cn.com/problems/move-zeroes/)

```html
输入: [0,1,0,3,12]
输出: [1,3,12,0,0]
```

1. 先把不是0的移动左
2. 最后陆续加0

```java
class Solution {
    public void moveZeroes(int[] nums) {
        int idx = 0;
        for (int num : nums) {
            if (num != 0) 
                nums[idx++] = num;
        }
        while (idx < nums.length) {
            nums[idx++] =0;
        }
    }
}
```

## 22 合并区间(950)

[https://leetcode-cn.com/problems/merge-intervals/](https://leetcode-cn.com/problems/merge-intervals/)

```html
给出一个区间的集合，请合并所有重叠的区间。
```

```html
输入: [[1,3],[2,6],[8,10],[15,18]]
输出: [[1,6],[8,10],[15,18]]
解释: 区间 [1,3] 和 [2,6] 重叠, 将它们合并为 [1,6].

输入: [[1,4],[4,5]]
输出: [[1,5]]
解释: 区间 [1,4] 和 [4,5] 可被视为重叠区间。
```


```java
class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals == null || intervals.length <= 1) return intervals;
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        List<int[]> list = new ArrayList<>();
        int i = 0;
        int n = intervals.length;
        while (i < n) {
            int l = intervals[i][0];
            int r = intervals[i][1];
            while (i < n - 1 && r >= intervals[i + 1][0]) {
                r = Math.max(r, intervals[i + 1][1]);
                i++;
            }
            list.add(new int[] {l, r});
            i++;
        }
        return list.toArray(new int[list.size()][2]);
    }
}
```

## 23 在排序数组中查找元素的第一个和最后一个位置(935)

[https://leetcode-cn.com/problems/find-first-and-last-position-of-element-in-sorted-array/](https://leetcode-cn.com/problems/find-first-and-last-position-of-element-in-sorted-array/)

```html
给定一个按照升序排列的整数数组 nums，和一个目标值 target。找出给定目标值在数组中的开始位置和结束位置。

你的算法时间复杂度必须是 O(log n) 级别。

如果数组中不存在目标值，返回 [-1, -1]。

```

```html
输入: nums = [5,7,7,8,8,10], target = 8
输出: [3,4]

输入: nums = [5,7,7,8,8,10], target = 6
输出: [-1,-1]
```

双指针+二分法

```java
class Solution {
    public int[] searchRange(int[] nums, int target) {
        int first = findFirst(nums, target);
        int last = findFirst(nums, target + 1) - 1;
        if (first == nums.length || nums[first] != target) {
            return new int[] {-1, -1};
        } else {
            return new int[]{first, Math.max(first, last)};
        }
    }
    private int findFirst(int[] nums, int target) {
        int l = 0, h = nums.length; // h 的初始值和往常不一样
        while (l < h) {
            int m = l + ( h - l) / 2;
            if (nums[m] >= target) h = m;
            else l = m + 1;
        }
        return l;
    }
}
```

## 24 全排列(985)

[https://leetcode-cn.com/problems/permutations/](https://leetcode-cn.com/problems/permutations/)

```html
给定一个 没有重复 数字的序列，返回其所有可能的全排列。
```

```html
输入: [1,2,3]
输出:
[
  [1,2,3],
  [1,3,2],
  [2,1,3],
  [2,3,1],
  [3,1,2],
  [3,2,1]
]
```

dfs

```java
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> permutes = new ArrayList<>();
        List<Integer> permuteList = new ArrayList<>();
        boolean[] hasVisited = new boolean[nums.length];
        backtracking(permuteList, permutes, hasVisited, nums);
        return permutes;
    }
    private void backtracking(List<Integer> permuteList, List<List<Integer>> permutes, boolean[] visited, final int[] nums) {
        if (permuteList.size() == nums.length) {
            permutes.add(new ArrayList<>(permuteList)); // 重新构造一个List
            return;
        }
        for (int i = 0; i < visited.length; i++) {
            if (visited[i]) continue;
            visited[i] = true;
            permuteList.add(nums[i]);
            backtracking(permuteList, permutes, visited, nums);
            permuteList.remove(permuteList.size() - 1);
            visited[i] = false;
        }
        
    }
}
```

## 25 只出现一次的数字(890)

[https://leetcode-cn.com/problems/single-number/](https://leetcode-cn.com/problems/single-number/)

```html
输入: [2,2,1]
输出: 1
```

异或是一种基于二进制的位运算，用符号XOR或者^表示，其运算法则是对运算符两侧数的每一个二进制位同值则取0，异值则取1
简单理解就是不进位加法

```java
class Solution {
    public int singleNumber(int[] nums) {
        int ret = 0;
        for (int num : nums) 
            ret = ret ^ num;
        return ret;
    }
}
```

## 26 岛屿数量(853)

[https://leetcode-cn.com/problems/number-of-islands/](https://leetcode-cn.com/problems/number-of-islands/)

```html
给你一个由 '1'（陆地）和 '0'（水）组成的的二维网格，请你计算网格中岛屿的数量。

岛屿总是被水包围，并且每座岛屿只能由水平方向或竖直方向上相邻的陆地连接形成。

此外，你可以假设该网格的四条边均被水包围。
```

```html
输入:
[
['1','1','1','1','0'],
['1','1','0','1','0'],
['1','1','0','0','0'],
['0','0','0','0','0']
]
输出: 1

输入:
[
['1','1','0','0','0'],
['1','1','0','0','0'],
['0','0','1','0','0'],
['0','0','0','1','1']
]
输出: 3
解释: 每座岛屿只能由水平和/或竖直方向上相邻的陆地连接而成。

```

dfs

```java
class Solution {
    private int m, n;
    private int[][] direaction = {{0,1},{0,-1},{1,0},{-1,0}};
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        m = grid.length;
        n = grid[0].length;
        int islandsNum = 0;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] != '0') {
                    dfs(grid, i, j);
                    islandsNum++;
                }
            }
        }
        return islandsNum;
    }

    private void dfs(char[][] grid, int i, int j) {
        if (i < 0 || i >= m || j < 0 || j >=n || grid[i][j] == '0') {
            return;
        }
        grid[i][j] = '0';
        for (int[] d : direaction) {
            dfs(grid, i + d[0], j + d[1]);
        }
    }
}
```

## 27 数组中的第K个最大元素(855)

[https://leetcode-cn.com/problems/kth-largest-element-in-an-array/](https://leetcode-cn.com/problems/kth-largest-element-in-an-array/)

```html
在未排序的数组中找到第 k 个最大的元素。请注意，你需要找的是数组排序后的第 k 个最大的元素，而不是第 k 个不同的元素。
```

```html
输入: [3,2,1,5,6,4] 和 k = 2
输出: 5

输入: [3,2,3,1,2,4,5,5,6] 和 k = 4
输出: 4
```

快排

```java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        k = nums.length - k;
        int l = 0, h = nums.length - 1;
        while (l < h) {
            int j = partition(nums, l , h);
            if (j == k) {
                break;
            } else if (j < k) {
                l = j + 1;
            } else {
                h = j - 1;
            }
        }
        return nums[k];
    }

    private int partition(int[] arr, int l, int r) {
        int pivot = l;
        int index = pivot + 1;
        for (int i = index; i <= r; i++) {
            if (arr[i] < arr[pivot]) {
                swap(arr, i, index++);
            }
        }
        swap(arr, pivot, index - 1);
        return index - 1;
    }

    private void swap(int[] arr, int i, int j) {
        int t = arr[i];
        arr[i] = arr[j];
        arr[j] = t; 
    }
}
```

## 28 缺失的第一个正数(751)

[https://leetcode-cn.com/problems/first-missing-positive/](https://leetcode-cn.com/problems/first-missing-positive/)

```html
给你一个未排序的整数数组，请你找出其中没有出现的最小的正整数。
```

```
输入: [1,2,0]
输出: 3
```

```
输入: [3,4,-1,1]
输出: 2
```

```
输入: [7,8,9,11,12]
输出: 1
```

怎么会怎么来，排序，接着遍历。

```java
class Solution {
    public int firstMissingPositive(int[] nums) {
        int ans = 1;
        Arrays.sort(nums);
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] > ans) break;
            if (nums[i] == ans) ans++;
        }
        return ans;
    }
}
```

## 29 最长上升子序列(718)

[https://leetcode-cn.com/problems/longest-increasing-subsequence/](https://leetcode-cn.com/problems/longest-increasing-subsequence/)

```html
给定一个无序的整数数组，找到其中最长上升子序列的长度。
```

```html
输入: [10,9,2,5,3,7,101,18]
输出: 4 
解释: 最长的上升子序列是 [2,3,7,101]，它的长度是 4。
```

**`dp[i]` 表示以 `nums[i]` 这个数结尾的最长递增子序列的长度**。

```java
class Solution {
    public int lengthOfLIS(int[] nums) {
        if (nums.length == 0) return 0;
        int[] dp = new int[nums.length];
        Arrays.fill(dp, 1);
        for (int i = 0; i < nums.length; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[i] > nums[j]) {
                    dp[i] = Math.max(dp[i], dp[j] + 1); // 关键这里，
                }
            }
        }
        return Arrays.stream(dp).max().orElse(0);
    }
}
```

## 30 将数组分成和相等的三个部分(798)

[https://leetcode-cn.com/problems/partition-array-into-three-parts-with-equal-sum/](https://leetcode-cn.com/problems/partition-array-into-three-parts-with-equal-sum/)

```html
给你一个整数数组 A，只有可以将其划分为三个和相等的非空部分时才返回 true，否则返回 false。

形式上，如果可以找出索引 i+1 < j 且满足 A[0] + A[1] + ... + A[i] == A[i+1] + A[i+2] + ... + A[j-1] == A[j] + A[j-1] + ... + A[A.length - 1] 就可以将数组三等分。
```

```html
输入：[0,2,1,-6,6,-7,9,1,2,0,1]
输出：true
解释：0 + 2 + 1 = -6 + 6 - 7 + 9 + 1 = 2 + 0 + 1

输入：[0,2,1,-6,6,7,9,-1,2,0,1]
输出：false

输入：[3,3,6,5,-2,2,5,1,-9,4]
输出：true

```

```java
class Solution {
    public boolean canThreePartsEqualSum(int[] A) {
        int sum = 0;
        // 遍历数组求总和
        for (int num : A) {
            sum += num;
        }
        // 数组A的和如果不能被3整除直接返回false
        if (sum % 3 != 0) {
            return false;
        }
        // 遍历数组累加，每累加到目标值cnt加1，表示又找到1段
        sum /= 3;
        int curSum = 0, cnt = 0;
        for (int i = 0; i < A.length; i++) {
            curSum += A[i];
            if (curSum == sum) {
                cnt++;
                curSum = 0;
            }
        }
        // 最后判断是否找到了3段（注意如果目标值是0的话可以大于3段）
        return cnt == 3 || (cnt > 3 && sum == 0);
    }
}
```

## 31 拼写单词(705)

[https://leetcode-cn.com/problems/find-words-that-can-be-formed-by-characters/](https://leetcode-cn.com/problems/find-words-that-can-be-formed-by-characters/)

```html
给你一份『词汇表』（字符串数组） words 和一张『字母表』（字符串） chars。

假如你可以用 chars 中的『字母』（字符）拼写出 words 中的某个『单词』（字符串），那么我们就认为你掌握了这个单词。

注意：每次拼写（指拼写词汇表中的一个单词）时，chars 中的每个字母都只能用一次。

返回词汇表 words 中你掌握的所有单词的 长度之和。
```

```html
输入：words = ["cat","bt","hat","tree"], chars = "atach"
输出：6
解释： 
可以形成字符串 "cat" 和 "hat"，所以答案是 3 + 3 = 6。

输入：words = ["hello","world","leetcode"], chars = "welldonehoneyr"
输出：10
解释：
可以形成字符串 "hello" 和 "world"，所以答案是 5 + 5 = 10。
```

类似于map的数组即可。双map

```java
class Solution {
    public int countCharacters(String[] words, String chars) {
        int[] hash = new int[26];
        for (char ch : chars.toCharArray()) {
            hash[ch - 'a']++;
        }
        int[] tmp = new int[26];
        int len = 0;
        for (String word : words) {
            Arrays.fill(tmp, 0);
            boolean flag = true;
            for (char ch : word.toCharArray()) {
                tmp[ch - 'a']++;
                if (tmp[ch - 'a'] > hash[ch - 'a']) 
                    flag = false;
            }
            len += flag ? word.length() : 0;
        }
        return len;
    }
}
```

## 32 子集(633)

[https://leetcode-cn.com/problems/subsets/](https://leetcode-cn.com/problems/subsets/)

```html
给定一组不含重复元素的整数数组 nums，返回该数组所有可能的子集（幂集）。

说明：解集不能包含重复的子集。
```

```html
输入: nums = [1,2,3]
输出:
[
  [3],
  [1],
  [2],
  [1,2,3],
  [1,3],
  [2,3],
  [1,2],
  []
]
```

```java
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> subsets = new ArrayList<>();
        List<Integer> tempSubset = new ArrayList<>();
        for (int size = 0; size <= nums.length; size++) {
            backtracking(0, tempSubset, subsets, size, nums); // 不同的子集大小
        }
        return subsets;
    }

    private void backtracking(int start, List<Integer> tempSubset, List<List<Integer>> subsets,
                            final int size, final int[] nums) {

        if (tempSubset.size() == size) {
            subsets.add(new ArrayList<>(tempSubset));
            return;
        }
        for (int i = start; i < nums.length; i++) {
            tempSubset.add(nums[i]);
            backtracking(i + 1, tempSubset, subsets, size, nums);
            tempSubset.remove(tempSubset.size() - 1);
        }
    }

}
```



## 33 岛屿的最大面积(648)

[https://leetcode-cn.com/problems/max-area-of-island/](https://leetcode-cn.com/problems/max-area-of-island/)

```html
给定一个包含了一些 0 和 1 的非空二维数组 grid 。

一个 岛屿 是由一些相邻的 1 (代表土地) 构成的组合，这里的「相邻」要求两个 1 必须在水平或者竖直方向上相邻。你可以假设 grid 的四个边缘都被 0（代表水）包围着。

找到给定的二维数组中最大的岛屿面积。(如果没有岛屿，则返回面积为 0 。)
```

```html
[[0,0,1,0,0,0,0,1,0,0,0,0,0],
 [0,0,0,0,0,0,0,1,1,1,0,0,0],
 [0,1,1,0,1,0,0,0,0,0,0,0,0],
 [0,1,0,0,1,1,0,0,1,0,1,0,0],
 [0,1,0,0,1,1,0,0,1,1,1,0,0],
 [0,0,0,0,0,0,0,0,0,0,1,0,0],
 [0,0,0,0,0,0,0,1,1,1,0,0,0],
 [0,0,0,0,0,0,0,1,1,0,0,0,0]]
 对于上面这个给定矩阵应返回 6。注意答案不应该是 11 ，因为岛屿只能包含水平或垂直的四个方向的 1 。
```

```java
class Solution {
    private int m, n;
    private int[][] direaction = {{0,1},{0,-1},{1,0},{-1,0}};
    public int maxAreaOfIsland(int[][] grid) {
        if(grid == null || grid.length == 0) return 0;
        m = grid.length;
        n = grid[0].length;
        int maxArea = 0;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                maxArea = Math.max(maxArea, dfs(grid, i, j));
            }
        }
        return maxArea;
    }   
    private int dfs(int[][] grid, int r, int c) {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] == 0) {
            return 0;
        }
        grid[r][c] = 0;
        int area = 1;
        for (int[] d : direaction) {
            area += dfs(grid, r + d[0], c + d[1]);
        }
        return area;
    }
}
```

## 34 每日温度(698)

[https://leetcode-cn.com/problems/daily-temperatures/](https://leetcode-cn.com/problems/daily-temperatures/)

```html
请根据每日 气温 列表，重新生成一个列表。对应位置的输出为：要想观测到更高的气温，至少需要等待的天数。如果气温在这之后都不会升高，请在该位置用 0 来代替。

例如，给定一个列表 temperatures = [73, 74, 75, 71, 69, 72, 76, 73]，你的输出应该是 [1, 1, 4, 2, 1, 1, 0, 0]。

提示：气温 列表长度的范围是 [1, 30000]。每个气温的值的均为华氏度，都是在 [30, 100] 范围内的整数。
```

递减栈

```java
class Solution {
    public int[] dailyTemperatures(int[] T) {
        Stack<Integer> stack = new Stack<>();
        int[] res = new int[T.length];
        for (int i = 0; i < T.length; i++) {
            while (!stack.isEmpty() && T[i] > T[stack.peek()]) {
                int t = stack.pop();
                res[t] = i - t;
            }
            stack.push(i);
        }
        return res;
    }
}
```

## 35 组合总和(582)

[https://leetcode-cn.com/problems/combination-sum/](https://leetcode-cn.com/problems/combination-sum/)

```html
给定一个无重复元素的数组 candidates 和一个目标数 target ，找出 candidates 中所有可以使数字和为 target 的组合。

candidates 中的数字可以无限制重复被选取。

```

```html
输入: candidates = [2,3,6,7], target = 7,
所求解集为:
[
  [7],
  [2,2,3]
]

输入: candidates = [2,3,6,7], target = 7,
所求解集为:
[
  [7],
  [2,2,3]
]

```

```java
class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> combinations = new ArrayList<>();
        backtracking(new ArrayList<>(), combinations, 0, target, candidates);
        return combinations;
    }

    private void backtracking(List<Integer> tempCombination, List<List<Integer>> combinations,
                            int start, int target, final int[] candidates) {

        if (target == 0) {
            combinations.add(new ArrayList<>(tempCombination));
            return;
        }
        for (int i = start; i < candidates.length; i++) {
            if (candidates[i] <= target) {
                tempCombination.add(candidates[i]);
                backtracking(tempCombination, combinations, i, target - candidates[i], candidates);
                tempCombination.remove(tempCombination.size() - 1);
            }
        }
    }
}
```

## 36 颜色分类(584)

[https://leetcode-cn.com/problems/sort-colors/](https://leetcode-cn.com/problems/sort-colors/)
给定一个包含红色、白色和蓝色，一共 n 个元素的数组，原地对它们进行排序，使得相同颜色的元素相邻，并按照红色、白色、蓝色顺序排列。

此题中，我们使用整数 0、 1 和 2 分别表示红色、白色和蓝色。

```
```html
输入: [2,0,2,1,1,0]
输出: [0,0,1,1,2,2]
```

zero和two作为双指针

```java
class Solution {
    public void sortColors(int[] nums) {
        int zero = -1, one = 0, two = nums.length;
        while (one < two) {
            if (nums[one] == 0) {
                swap(nums, ++zero, one++);
            } else if (nums[one] == 2){
                swap(nums, --two, one);
            } else {
                ++one;
            }
        }
    }
    private void swap(int[] a, int i, int j) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
}
```

## 37 三角形最小路径和(523)

[https://leetcode-cn.com/problems/triangle/](https://leetcode-cn.com/problems/triangle/)

```html
给定一个三角形，找出自顶向下的最小路径和。每一步只能移动到下一行中相邻的结点上。

相邻的结点 在这里指的是 下标 与 上一层结点下标 相同或者等于 上一层结点下标 + 1 的两个结点。
```

```html
[
     [2],
    [3,4],
   [6,5,7],
  [4,1,8,3]
]
```

dp

```java
class Solution {
    public int minimumTotal(List<List<Integer>> triangle) {
        if(triangle.size() == 0) return 0;
        int row = triangle.size();
        int[][] dp = new int[row][triangle.get(row - 1).size()];
        // 初始化
        for(int i = 0; i < row; i++) {
            for (int j =0; j < triangle.get(i).size(); j++) {
                dp[i][j] = triangle.get(i).get(j);
            }
        }
        // 从下往上， 初始化最后一行
        for (int i = 0; i < triangle.get(row - 1).size(); i++) {
            dp[row - 1][i] = triangle.get(row - 1).get(i);
        }
        // 动态规划
        for (int i = row - 2; i >= 0; i--) {
            for (int j = 0; j < triangle.get(i).size(); j++) {
                dp[i][j] = Math.min(dp[i+1][j], dp[i+1][j+1]) + triangle.get(i).get(j);
            }
        }
        return dp[0][0];
    }
}
```

## 38 乘积最大子数组(541)

[https://leetcode-cn.com/problems/maximum-product-subarray/](https://leetcode-cn.com/problems/maximum-product-subarray/)

```html
给你一个整数数组 nums ，请你找出数组中乘积最大的连续子数组（该子数组中至少包含一个数字），并返回该子数组所对应的乘积。
```

```html
输入: [2,3,-2,4]
输出: 6
解释: 子数组 [2,3] 有最大乘积 6。

输入: [-2,0,-1]
输出: 0
解释: 结果不能为 2, 因为 [-2,-1] 不是子数组。
```

dp

```java
class Solution {
    public int maxProduct(int[] nums) {
        if (nums.length == 0) return 0;
        int ans = Integer.MIN_VALUE;
        int[] dpMax = new int[nums.length + 1];
        int[] dpMin = new int[nums.length + 1];
        dpMax[0] = 1;
        dpMin[0] = 1;
        for (int i = 1; i <= nums.length; i++) {
            if (nums[i-1] < 0) {
                int temp = dpMax[i-1];
                dpMax[i-1] = dpMin[i-1];
                dpMin[i-1] = temp;
            }
            dpMax[i] = Math.max(dpMax[i-1]*nums[i-1], nums[i-1]);
            dpMin[i] = Math.min(dpMin[i-1]*nums[i-1], nums[i-1]);
            ans = Math.max(ans, dpMax[i]);
        }
        return ans;
    }
}
```

## 39 两数之和 II - 输入有序数组(559)

[https://leetcode-cn.com/problems/two-sum-ii-input-array-is-sorted/](https://leetcode-cn.com/problems/two-sum-ii-input-array-is-sorted/)

```html
给定一个已按照升序排列 的有序数组，找到两个数使得它们相加之和等于目标数。

函数应该返回这两个下标值 index1 和 index2，其中 index1 必须小于 index2。

说明:

返回的下标值（index1 和 index2）不是从零开始的。
你可以假设每个输入只对应唯一的答案，而且你不可以重复使用相同的元素。

```

```html
输入: numbers = [2, 7, 11, 15], target = 9
输出: [1,2]
解释: 2 与 7 之和等于目标数 9 。因此 index1 = 1, index2 = 2 。
```

```java
class Solution {
    public int[] twoSum(int[] numbers, int target) {
        if (numbers == null) return null;
        // 双指针
        int p1 = 0, p2 = numbers.length - 1;
        while (p1 < p2) {
            int sum = numbers[p1] + numbers[p2];
            if (sum == target) return new int[]{p1+1, p2+1};
            else if (sum < target) p1++;
            else p2--;
        }
        return null;
    }
}
```

## 40 旋转数组(517)

[https://leetcode-cn.com/problems/rotate-array/](https://leetcode-cn.com/problems/rotate-array/)

给定一个数组，将数组中的元素向右移动 k 个位置，其中 k 是非负数。

```html
输入: [1,2,3,4,5,6,7] 和 k = 3
输出: [5,6,7,1,2,3,4]
解释:
向右旋转 1 步: [7,1,2,3,4,5,6]
向右旋转 2 步: [6,7,1,2,3,4,5]
向右旋转 3 步: [5,6,7,1,2,3,4]

输入: [-1,-100,3,99] 和 k = 2
输出: [3,99,-1,-100]
解释: 
向右旋转 1 步: [99,-1,-100,3]
向右旋转 2 步: [3,99,-1,-100]

```

```java
class Solution {
    public void rotate(int[] nums, int k) {
        int n = nums.length;
        k %= n;
        reverse(nums, 0, n - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, n - 1);
    }
    private void reverse(int[] nums, int start, int end) {
        while(start < end) {
            int temp = nums[start];
            nums[start++] = nums[end];
            nums[end--] = temp;
        }
    }
}
```

## 41 寻找重复数(515)

[https://leetcode-cn.com/problems/find-the-duplicate-number/](https://leetcode-cn.com/problems/find-the-duplicate-number/)

```html
给定一个包含 n + 1 个整数的数组 nums，其数字都在 1 到 n 之间（包括 1 和 n），可知至少存在一个重复的整数。假设只有一个重复的整数，找出这个重复的数。

输入: [1,3,4,2,2]
输出: 2

输入: [3,1,3,4,2]
输出: 3

```

我们可以使用双指针解决本题，慢指针每次走一步，快指针每次走两步

快指针走了：a + ( b + c ) m + b a + (b+c)m + b*a*+(*b*+*c*)*m*+*b*
慢指针走了：a + ( b + c ) n + b a + (b+c)n + b*a*+(*b*+*c*)*n*+*b*
根据快走的是慢的两倍，
a + ( b + c ) m + b = 2 ( a + ( b + c ) n + b ) a + (b+c)m + b = 2(a + (b+c)n + b)*a*+(*b*+*c*)*m*+*b*=2(*a*+(*b*+*c*)*n*+*b*) =>
a = ( b + c ) ( m − 2 n ) − b a = (b+c)(m-2n) - b*a*=(*b*+*c*)(*m*−2*n*)−*b*

得 a 的距离为（环长度的倍数 - b），即从头节点走到环开头节点等于 slow 指针走到环开头节点的距离

```java
class Solution {
    public int findDuplicate(int[] nums) {
        int slow = nums[0], fast = nums[nums[0]];
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[nums[fast]];
        }
        fast = 0;
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }
        return slow;
    }
}
```

## 42 存在重复元素(471)

[https://leetcode-cn.com/problems/contains-duplicate/](https://leetcode-cn.com/problems/contains-duplicate/)

```html
给定一个整数数组，判断是否存在重复元素。

如果任意一值在数组中出现至少两次，函数返回 true 。如果数组中每个元素都不相同，则返回 false 。

输入: [1,2,3,1]
输出: true

```

```java
class Solution {
    public boolean containsDuplicate(int[] nums) {
        HashSet<Integer> set = new HashSet<>();
        for (int num : nums) {
            if (!set.add(num)) {
                return true;
            }
        }
        return false;
    }
}
```



## 43 除自身以外数组的乘积(467)

[https://leetcode-cn.com/problems/product-of-array-except-self/](https://leetcode-cn.com/problems/product-of-array-except-self/)

```html
给你一个长度为 n 的整数数组 nums，其中 n > 1，返回输出数组 output ，其中 output[i] 等于 nums 中除 nums[i] 之外其余各元素的乘积。
输入: [1,2,3,4]
输出: [24,12,8,6]
```

```java
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] products = new int[n];
        Arrays.fill(products, 1);
        int left = 1;
        for (int i = 1; i < n; i++) {
            left *= nums[i - 1];
            products[i] *= left;
        }
        int right = 1;
        for (int i = n - 2; i >= 0; i--) {
            right *= nums[i + 1];
            products[i] *= right;
        }
        return products;
    }
}
```

## 44 两个数组的交集 II(402)

[https://leetcode-cn.com/problems/intersection-of-two-arrays-ii/](https://leetcode-cn.com/problems/intersection-of-two-arrays-ii/)

给定两个数组，编写一个函数来计算它们的交集。

```html
输入: nums1 = [1,2,2,1], nums2 = [2,2]
输出: [2,2]

输入: nums1 = [4,9,5], nums2 = [9,4,9,8,4]
输出: [4,9]

```

```java
class Solution {
    public int[] intersect(int[] nums1, int[] nums2) {
        ArrayList<Integer> list1 = new ArrayList<>();
        for (int num : nums1) {
            list1.add(num);
        }
        ArrayList<Integer> list2 = new ArrayList<>();
        for (int num : nums2) {
            if (list1.contains(num)) {
                list2.add(num);
                list1.remove(num);
            }
        }
        return list2.stream().mapToInt(Integer::valueOf).toArray();
    }
}
```

## 45 子集 II(304)

[https://leetcode-cn.com/problems/subsets-ii/](https://leetcode-cn.com/problems/subsets-ii/)

```html
给定一个可能包含重复元素的整数数组 nums，返回该数组所有可能的子集（幂集）。

说明：解集不能包含重复的子集。

输入: [1,2,2]
输出:
[
  [2],
  [1],
  [1,2,2],
  [2,2],
  [1,2],
  []
]
```

```java
class Solution {
    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> subsets = new ArrayList<>();
        List<Integer> tempSubset = new ArrayList<>();
        boolean[] hasVisited = new boolean[nums.length];
        for (int size = 0; size <= nums.length; size++) {
            backtracking(0, tempSubset, subsets, hasVisited, size, nums); // 不同的子集大小
        }
        return subsets;
    }

    private void backtracking(int start, List<Integer> tempSubset, List<List<Integer>> subsets, boolean[] hasVisited,
                            final int size, final int[] nums) {

        if (tempSubset.size() == size) {
            subsets.add(new ArrayList<>(tempSubset));
            return;
        }
        for (int i = start; i < nums.length; i++) {
            if (i != 0 && nums[i] == nums[i - 1] && !hasVisited[i - 1]) {
                continue;
            }
            tempSubset.add(nums[i]);
            hasVisited[i] = true;
            backtracking(i + 1, tempSubset, subsets, hasVisited, size, nums);
            hasVisited[i] = false;
            tempSubset.remove(tempSubset.size() - 1);
        }
    }

}
```

## 46 寻找旋转排序数组中的最小值(316)

[https://leetcode-cn.com/problems/find-minimum-in-rotated-sorted-array/](https://leetcode-cn.com/problems/find-minimum-in-rotated-sorted-array/)

```html
假设按照升序排序的数组在预先未知的某个点上进行了旋转。

( 例如，数组 [0,1,2,4,5,6,7] 可能变为 [4,5,6,7,0,1,2] )。

请找出其中最小的元素。

你可以假设数组中不存在重复元素。

输入: [3,4,5,1,2]
输出: 1

输入: [4,5,6,7,0,1,2]
输出: 0
```

```java
class Solution {
    public int findMin(int[] nums) {
        int l = 0, h = nums.length - 1;
        while (l < h) {
            int m = l + (h - l) / 2;
            if (nums[m] <= nums[h]) {
                h = m;
            } else {
                l = m + 1;
            }
        }
        return nums[l];
    }
}
```

## 47 有序矩阵中第K小的元素(337)

[https://leetcode-cn.com/problems/kth-smallest-element-in-a-sorted-matrix/](https://leetcode-cn.com/problems/kth-smallest-element-in-a-sorted-matrix/)

```html
给定一个 n x n 矩阵，其中每行和每列元素均按升序排序，找到矩阵中第 k 小的元素。
请注意，它是排序后的第 k 小元素，而不是第 k 个不同的元素。

matrix = [
   [ 1,  5,  9],
   [10, 11, 13],
   [12, 13, 15]
],
k = 8,

返回 13。
```

```java
class Solution {
    public int kthSmallest(int[][] matrix, int k) {
        int m = matrix.length, n = matrix[0].length;
        int lo = matrix[0][0], hi = matrix[m - 1][n - 1];
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int cnt = 0;
            for (int i = 0; i < m; i++) {
                for (int j = 0; j < n && matrix[i][j] <= mid; j++) {
                    cnt++;
                }
            }
            if (cnt < k) lo = mid + 1;
            else hi = mid - 1;
        }
        return lo;
    }
}
```

