---
title: "[Algorithm] Search"
published: 2021-06-12
tags:
  - Algorithm
lang: zh
toc: true
abbrlink: algorithm-search
---
<!--more-->


## 1 BFS

广度优先搜索一层一层的进行遍历，每次遍历以上层遍历的结果作为起点，遍历一个距离能达到的节点，注意去除重复遍历的情况

### 1.1 [279. 完全平方数](https://leetcode-cn.com/problems/perfect-squares/)

给定正整数 *n*，找到若干个完全平方数（比如 `1, 4, 9, 16, ...`）使得它们的和等于 *n*。你需要让组成和的完全平方数的个数最少。

```java
public int numSquares(int n) {
    Queue<Integer> queue = new LinkedList<>();
    HashSet<Integer> visited = new HashSet<>();
    int level = 0;
    queue.add(n);
    while (!queue.isEmpty()) {
        int size = queue.size();
        level++; // 开始生成下一层
        for (int i = 0; i < size; i++) {
            int cur = queue.poll();
            //依次减 1, 4, 9... 生成下一层的节点
            for (int j = 1; j * j <= cur; j++) {
                int next = cur - j * j;
                if (next == 0) {
                    return level;
                }
                if (!visited.contains(next)) {
                    queue.offer(next);
                    visited.add(next);
                }
            }
        }
    }
    return -1;
}
```

### 1.2 [127. 单词接龙](https://leetcode-cn.com/problems/word-ladder/)

给定两个单词（beginWord 和 endWord）和一个字典，找到从 beginWord 到 endWord 的最短转换序列的长度。转换需遵循如下规则：

每次转换只能改变一个字母。
转换过程中的中间单词必须是字典中的单词。

```java
public class Solution {

    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        // 第 1 步：先将 wordList 放到哈希表里，便于判断某个单词是否在 wordList 里
        Set<String> wordSet = new HashSet<>(wordList);
        if (wordSet.size() == 0 || !wordSet.contains(endWord)) {
            return 0;
        }
        wordSet.remove(beginWord);
        
        // 第 2 步：图的广度优先遍历，必须使用队列和表示是否访问过的 visited 哈希表
        Queue<String> queue = new LinkedList<>();
        queue.offer(beginWord);
        Set<String> visited = new HashSet<>();
        visited.add(beginWord);
        
        // 第 3 步：开始广度优先遍历，包含起点，因此初始化的时候步数为 1
        int step = 1;
        while (!queue.isEmpty()) {
            int currentSize = queue.size();
            for (int i = 0; i < currentSize; i++) {
                // 依次遍历当前队列中的单词
                String currentWord = queue.poll();
                // 如果 currentWord 能够修改 1 个字符与 endWord 相同，则返回 step + 1
                if (changeWordEveryOneLetter(currentWord, endWord, queue, visited, wordSet)) {
                    return step + 1;
                }
            }
            step++;
        }
        return 0;
    }

    /*
     * 尝试对 currentWord 修改每一个字符，看看是不是能与 endWord 匹配
     * @param currentWord
     * @param endWord
     * @param queue
     * @param visited
     * @param wordSet
     * @return
     */
    private boolean changeWordEveryOneLetter(String currentWord, String endWord,
                                             Queue<String> queue, Set<String> visited, Set<String> wordSet) {
        char[] charArray = currentWord.toCharArray();
        for (int i = 0; i < endWord.length(); i++) {
            // 先保存，然后恢复
            char originChar = charArray[i];
            for (char k = 'a'; k <= 'z'; k++) {
                if (k == originChar) {
                    continue;
                }
                charArray[i] = k;
                String nextWord = String.valueOf(charArray);
                if (wordSet.contains(nextWord)) {
                    if (nextWord.equals(endWord)) {
                        return true;
                    }
                    if (!visited.contains(nextWord)) {
                        queue.add(nextWord);
                        // 注意：添加到队列以后，必须马上标记为已经访问
                        visited.add(nextWord);
                    }
                }
            }
            // 恢复
            charArray[i] = originChar;
        }
        return false;
    }
}
```

### 1.3 [542. 01 矩阵](https://leetcode-cn.com/problems/01-matrix/)

给定一个由 0 和 1 组成的矩阵，找出每个元素到最近的 0 的距离。

两个相邻元素间的距离为 1 。

```java
class Solution {
    public int[][] updateMatrix(int[][] matrix) {
        Deque<int[]> queue = new LinkedList<>();
        for(int i = 0; i < matrix.length;i++){
            for(int j = 0; j< matrix[0].length;j++){
                if(matrix[i][j] == 0){
                    queue.offer(new int[]{i,j});	//源点入队
                }else{
                    matrix[i][j] = -1;  //标记未访问到的1
                }
            }
        }
        int[][] dir = new int[][]{{0,1},{1,0},{-1,0},{0,-1}}; //用来循环访问源点的上下左右

        while(!queue.isEmpty()){
            int[] point = queue.poll();
            int x = point[0],y = point[1];
            for(int[] d:dir){
                int x1 = x+d[0],y1 = y +d[1];	//源点的四周的点
                if(x1 >= 0 && x1 < matrix.length && y1 >=0 && y1 < matrix[0].length && matrix[x1][y1] == -1){  //这个1在矩阵内且未被访问过
                    matrix[x1][y1] = matrix[x][y] + 1; //距离加一
                    queue.offer(new int[]{x1,y1}); //将源点四周的点入队
                }

            }

        }
        return matrix;
    }
}
```

## 2 DFS

从一个节点出发，使用DFS对一个图进行遍历，能到达的都是从初始节点可达的，DFS用来解决可达性问题

注意：

用栈保存当前节点信息

### 2.1 [200. 岛屿数量](https://leetcode-cn.com/problems/number-of-islands/)

给你一个由 '1'（陆地）和 '0'（水）组成的的二维网格，请你计算网格中岛屿的数量。

岛屿总是被水包围，并且每座岛屿只能由水平方向和/或竖直方向上相邻的陆地连接形成。

此外，你可以假设该网格的四条边均被水包围。

处。

```java
class Solution {
    private int m,n;
    private int[][] dir = new int[][]{{0,1},{0,-1},{-1,0},{1,0}};
    public int numIslands(char[][] grid) {
        //空矩阵
        if(grid == null || grid.length == 0){
            return 0;
        }
        m = grid.length;
        n = grid[0].length;
        int islands = 0;
        for(int i = 0 ; i < m;i++){
            for(int j = 0 ; j < n ;j++){
                //有一个1，进行dfs，将与它相连的全部沉没
                if(grid[i][j] == '1'){
                    dfs(grid,i,j);
                    islands++;
                }
                
            }
        }
        return islands;   
}

    private void dfs(char[][] grid,int r,int c){
        //终止条件：在范围外或者是0；
        if(r>=m||r<0||c>=n||c<0||grid[r][c]=='0') return;
        //沉没当前
        grid[r][c] = '0';
        //沉没四周
        for(int[] d :dir){
            dfs(grid,r+d[0],c+d[1]);
        }

    }
}
```



### 2.2 [695. 岛屿的最大面积](https://leetcode-cn.com/problems/max-area-of-island/)

给定一个包含了一些 0 和 1 的非空二维数组 grid 。

一个 岛屿 是由一些相邻的 1 (代表土地) 构成的组合，这里的「相邻」要求两个 1 必须在水平或者竖直方向上相邻。你可以假设 grid 的四个边缘都被 0（代表水）包围着。

找到给定的二维数组中最大的岛屿面积。(如果没有岛屿，则返回面积为 0 。)

```java
class Solution {
    private int m,n;
    private int[][] dir = new int[][]{{0,1},{0,-1},{1,0},{-1,0}};
    public int maxAreaOfIsland(int[][] grid) {
        if(grid == null ||grid.length == 0){
            return 0;
        }
        m = grid.length;
        n = grid[0].length;
        int maxArea = 0;
        for(int i = 0; i < m ;i++){
            for(int j = 0;j < n ;j++){
                if(grid[i][j] == 1){
                    maxArea = Math.max(maxArea,dfs(grid,i,j));
                }
            }
        }
        return maxArea;
    }

    private int dfs(int[][] grid,int r,int c){
        if(r<0 || r>=grid.length || c< 0 || c>=grid[0].length || grid[r][c]==0){
            return 0;
        }
        grid[r][c] = 0;
        int max = 1;
        for(int[] d : dir){
            max += dfs(grid,r+d[0],c+d[1]);
        }  
        return max;
    }
}
```



### 2.3 [547. 朋友圈](https://leetcode-cn.com/problems/friend-circles/)

班上有 N 名学生。其中有些人是朋友，有些则不是。他们的友谊具有是传递性。如果已知 A 是 B 的朋友，B 是 C 的朋友，那么我们可以认为 A 也是 C 的朋友。所谓的朋友圈，是指所有朋友的集合。

给定一个 N * N 的矩阵 M，表示班级中学生之间的朋友关系。如果M[i][j] = 1，表示已知第 i 个和 j 个学生互为朋友关系，否则为不知道。你必须输出所有学生中的已知的朋友圈总数。

```java
//求无向图的连通分量
//如果ij两人是朋友，那么ij之间有边相连
class Solution {
    public int findCircleNum(int[][] M) {
        boolean[] visited = new boolean[M.length];
        int ans = 0;
        for(int i = 0; i < M.length; i++) {
            if(!visited[i]) {
                ans++;
                dfs(M, i, visited);
            }
        }
        return ans;
    }

    private void dfs(int[][] M, int i, boolean[] visited) {
        visited[i] = true;
        for(int j = 0; j < M.length; j++) {
            if(!visited[j] && M[i][j] == 1) {
                dfs(M, j, visited);
            }
        }
    }
}
```



### 2.4 [130. 被围绕的区域](https://leetcode-cn.com/problems/surrounded-regions/)

给定一个二维的矩阵，包含 `'X'` 和 `'O'`（**字母 O**）。

找到所有被 `'X'` 围绕的区域，并将这些区域里所有的 `'O'` 用 `'X'` 填充。

```java
//先填充最外侧，因为最外侧的O肯定不能被围绕，将它置为T，然后DFS它附近的O，标记
//全部标记完成后，遍历将O置为X，T置为O
class Solution {
    private int m,n;
    private int[][] dir = {{1,0},{0,1},{-1,0},{0,-1}};
    public void solve(char[][] board) {
        if(board == null || board.length == 0) return;
        m = board.length;
        n = board[0].length;
        for(int i = 0; i < m; i++){
            dfs(board,i,0);
            dfs(board,i,n-1);
        }
        for(int i = 0; i < n; i++){
            dfs(board,0,i);
            dfs(board,m-1,i);
        }

        for(int i = 0 ; i < m ; i++){
            for(int j = 0 ; j < n ;j++){
                if(board[i][j] == 'T'){
                    board[i][j] = 'O';
                }else if(board[i][j] == 'O'){
                    board[i][j] = 'X';
                }

            }
        }
    }

    private void dfs(char[][] board , int r, int c){
        if(r < 0 || r >= m || c < 0 || c >= n || board[r][c] != 'O'){
            return;
        }
        board[r][c] = 'T';
        for(int[] d : dir){
            dfs(board , r+d[0] , c+d[1]);
        }

    }
}
```



### 2.5 [417. 太平洋大西洋水流问题](https://leetcode-cn.com/problems/pacific-atlantic-water-flow/)

给定一个 m x n 的非负整数矩阵来表示一片大陆上各个单元格的高度。“太平洋”处于大陆的左边界和上边界，而“大西洋”处于大陆的右边界和下边界。

规定水流只能按照上、下、左、右四个方向流动，且只能从高到低或者在同等高度上流动。

请找出那些水流既可以流动到“太平洋”，又能流动到“大西洋”的陆地单元的坐标。 

```java
//反过来，从大西洋和太平洋向里面爬，两个区域的交点就是所需要的坐标
public class pacificAtlantic {
    private static int[][] dires = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    private int m, n;
    private int[][] matrix;
    
    public List<List<Integer>> pacificAtlantic(int[][] matrix) {
        List<List<Integer>> res = new ArrayList<>();
        m = matrix.length;
        if (m == 0)
            return res;
        n = matrix[0].length;
        if (n == 0)
            return res;
        this.matrix = matrix;
        boolean[][] canReachP = new boolean[m][n];
        boolean[][] canReachA = new boolean[m][n];
        for (int i = 0; i < n; i++) {
            dfs(0, i, canReachP);
            dfs(m - 1, i, canReachA);
        }
        for (int i = 0; i < m; i++) {
            dfs(i, 0, canReachP);
            dfs(i, n - 1, canReachA);
        }
        for(int i = 0; i < m; i++){
            for(int j = 0; j < n; j++){
                if(canReachA[i][j] && canReachP[i][j]){
                    List<Integer> temp = new ArrayList<>();
                    temp.add(i);
                    temp.add(j);
                    res.add(temp);
                }
            }
        }
        return res;
    }
    
    //换一种思路，从边界往里面走，只能走到比自己更高或者等高的地方。边界能走到的地方，就是能流入对应海洋的地方。
    private void dfs(int x, int y, boolean[][] canReach) {
        canReach[x][y] = true;
        for (int i = 0; i < 4; i++) {
            int newX = x + dires[i][0];
            int newY = y + dires[i][1];
            if (isIn(newX, newY) && matrix[x][y] <= matrix[newX][newY] && !canReach[newX][newY]) {
                dfs(newX, newY, canReach);
            }
        }
    }

    private boolean isIn(int x, int y) {
        return x >= 0 && x < m && y >= 0 && y < n;
    }
}
```



## 3 Backtracking

### 3.1 1.DFS与回溯的区别

回溯属于DFS，普通的DFS用来求解可达性问题，而回溯建立在DFS基础上，在搜索过程中，达到结束条件后，恢复状态，回溯上一层，再次搜索。区别就在于有没有状态的重置。

回溯问题都可以抽象成树形结构，都是在集合中递归查找子集

**集合的大小决定数的宽度，递归的深度决定树的深度**

```java
//模板
void backtracking(参数) {
    if (终止条件) {
        存放结果;
        return;
    }
    for (选择：本层集合中元素（树中节点孩子的数量就是集合的大小）) {
        处理节点;
        backtracking(路径，选择列表); // 递归
        回溯，撤销处理结果
    }
}
```



### 3.2 2.回溯算法的使用场景

当问题需要找出所有的解时，比如求解排列组合问题。

满足结束条件或者发现不是正确的路径的时候，**撤销选择**，回退到上一个状态，继续尝试。

### 3.3 3.使用的步骤

- 画出递归树，找到状态变量（回溯函数的参数）
- 确定结束条件
- 找出选择列表，与函数参数相关
- 判断是否需要剪枝
- 做出选择，递归调用，进入下一层
- 撤销选择

### 3.4 4.回溯的类型

| 类型     | 概念                                      |
| -------- | ----------------------------------------- |
| 组合问题 | N个数里面按一定规则找出k个数的集合        |
| 排列     | N个数按一定规则全排列，求出所有的排列方式 |
| 切割问题 | 一个字符串按一定规则有多少种切割方式      |
| 子集问题 | N个数的集合里有多少种符合条件的子集       |
| 棋盘问题 | N皇后，数独等                             |

组合不强调元素顺序，排列强调元素顺序

“排列”类型问题和“子集、组合”问题不同在于：“排列”问题使用used数组来标识选择列表，而“子集、组合”问题则使用start参数。另外还需注意两种问题的判重剪枝！

#### 3.4.1 组合问题

如果是一个集合求组合，需要 start 来控制 for 循环的起始位置

如果是多个集合取组合，他们互不影响，就不用 start

##### 3.4.1.1 去重：

当 candidate[i] == candidate[i-1] 时，有两种情况

两个维度：同一个递归层的重复和递归枝的重复，可以根据 used[i-1] 进行判断

如果是同一层上的重复，used[i-1]  == false 不可以进行重复的选取

如果是同一枝上的重复，used[i-1]  == true 可以进行重复的选取

#### 3.4.2 切割问题

- 如何模拟那些切割线
- 切割问题中递归如何终止
- 在递归循环中如何截取子串
- 如何判断回文

#### 3.4.3 子集问题

子集问题是收集所有节点的结果，组合是收集叶子节点的结果

##### 3.4.3.1 递增子序列的去重不能先排序

##### 3.4.3.2 子集类的剪枝：

判断是否需要剪枝，先排序

去除从重复的集合，也就是去除当前的选择列表中，与上一个重复的数，所引出的分支

#### 3.4.4 排列问题

排列的有序的，因此不需要 start，每次都是从0开始

需要一个 used 数组对已经使用的进行记录

##### 3.4.4.1 排列的去重：**使用(used[i - 1] == false)，即树层去重，效率更高**

因为对于树层，如果重复元素相邻，那么如果前面的是false，肯定就已经是用过了

#### 3.4.5 去重问题

用set和数组都可以，数组效率更高

#### 3.4.6 棋盘问题

##### 3.4.6.1 N皇后：

二维矩阵中矩阵的高就是这颗树的高度，矩阵的宽就是树形结构中每一个节点的宽度。

**棋盘的宽度就是for循环的长度，递归的深度就是棋盘的高度**

##### 3.4.6.2 数独：

相较于N皇后，每一列每一行都只要放一个数字，只需要一层 for 循环遍历一行，递归来遍历列，然后一行一列确定皇后的唯一位置。

**棋盘的每一个位置都要放一个数字，并检查数字是否合法，解数独的树形结构要比N皇后更宽更深**

### 3.5 [17. 电话号码的字母组合](https://leetcode-cn.com/problems/letter-combinations-of-a-phone-number/)

给定一个仅包含数字 `2-9` 的字符串，返回所有它能表示的字母组合。

给出数字到字母的映射如下（与电话按键相同）。注意 1 不对应任何字母。

```java
class Solution {
    //记录数字对应字符串的映射
    private final String[] Keys = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    public List<String> letterCombinations(String digits) {
        List<String> res = new ArrayList<>();
        if(digits == null || digits.length() == 0){
            return res;
        }
        //回溯
        BackTracking(new StringBuilder(), res, digits);
        return res;
    }

    private void BackTracking(StringBuilder prefix, List<String> res, final String digits){
        //递归中止条件
        if(prefix.length() == digits.length()){
            //作为答案加入
            res.add(prefix.toString());
            return;
        }
        //当前应当映射的数字
        int cur = digits.charAt(prefix.length()) - '0';
        //数字对应的字符串
        String letters = Keys[cur];
        //遍历其中的字符
        for(char c : letters.toCharArray()){
            //添加字符
            prefix.append(c);
            //以添加后的为基础递归
            BackTracking(prefix,res,digits);
            //递归结束，回溯，移除当前的字符
            prefix.deleteCharAt(prefix.length() - 1);
        }
    }
}
```



### 3.6 [93. 复原IP地址](https://leetcode-cn.com/problems/restore-ip-addresses/)

给定一个只包含数字的字符串，复原它并返回所有可能的 IP 地址格式。

有效的 IP 地址 正好由四个整数（每个整数位于 0 到 255 之间组成，且不能含有前导 0），整数之间用 '.' 分隔。

例如："0.1.2.201" 和 "192.168.1.1" 是 有效的 IP 地址，但是 "0.011.255.245"、"192.168.1.312" 和 "192.168@1.1" 是 无效的 IP 地址。

```java
class Solution {
    public List<String> restoreIpAddresses(String s) {
        //记录答案
        List<String> res = new ArrayList<>();
        //记录当前ip地址
        StringBuilder curAddress = new StringBuilder();
        backTracking(0,curAddress,res,s);
        return res;
    }

    private void backTracking(int k, StringBuilder curAddress, List<String> res, String s){
        //递归中止条件，ip地址有四个数或者字符串为空
        if(k == 4 || s.length() == 0){
            //如果是有效的ip地址，加入答案中
            if(k == 4 && s.length() == 0){
                res.add(curAddress.toString());
            }
            return;
        }
        //针对1，2，3位的ip地址逐个判断
        for(int i = 0; i < s.length() && i <= 2; i++){
            //如果首位是零并且不是一位数，那么是无效的
            if(i != 0 && s.charAt(0) == '0'){
                break;
            }
            //从字符串中取出相应长度的数字
            String part = s.substring(0,i+1);
            //判断是否有效
            if(Integer.valueOf(part) <= 255){
                //累加方式
                if(curAddress.length() != 0){
                    part = '.' + part;
                }
                curAddress.append(part);
                //进行下一步的递归
                backTracking(k+1,curAddress,res,s.substring(i+1));
                //取消上一层的状态
                curAddress.delete(curAddress.length() - part.length(), curAddress.length());
            }
        }
    }
}
```

### 3.7 [257. 二叉树的所有路径](https://leetcode-cn.com/problems/binary-tree-paths/)

给定一个二叉树，返回所有从根节点到叶子节点的路径。

```java
class Solution {
    public List<String> binaryTreePaths(TreeNode root) {
        List<String> list = new ArrayList<>();
        helper(root,"",list);
        return list;

    }
	//前序遍历，根->左->右
    private void helper(TreeNode root,String path,List<String> list){ 
        if(root == null)   return;
        path += Integer.toString(root.val);
        //如果到底了，复制path，加入答案
        if((root.left == null) && (root.right == null)){ 
            list.add(path.toString());
        }else{
            path += "->";
            helper(root.left,path,list);
            helper(root.right,path,list);
        }
    }
}
```



### 3.8 [46. 全排列](https://leetcode-cn.com/problems/permutations/)

给定一个 **没有重复** 数字的序列，返回其所有可能的全排列。

```java
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        //全排列
        List<List<Integer>> res = new ArrayList<>();
        //当前排列
        List<Integer> cur = new ArrayList<>();
        //标记是否已经访问过
        boolean[] hasVisited = new boolean[nums.length];
        //回溯
        backTracking (cur, res, hasVisited, nums);
        return res;

    }

    private void backTracking(List<Integer> cur, List<List<Integer>> res, boolean[] hasVisited, int[] nums){
        //加入结果
        if(cur.size() == nums.length){
            //要新建，不然后面会被修改
            res.add(new ArrayList<>(cur));
        }
        //遍历可能的组合
        for(int i = 0; i < hasVisited.length; i++){
            //如果已经访问过的，通过
           if(hasVisited[i]){
               continue;
           }
           //加入答案，将访问标记置为true
           hasVisited[i] = true;
           cur.add(nums[i]); 
           //回溯剩下的部分
           backTracking(cur,res,hasVisited,nums);
           //移除之前回溯的状态
           cur.remove(cur.size()-1);
           hasVisited[i] = false;
        }
    }
}
```

### 3.9 [47. 全排列 II](https://leetcode-cn.com/problems/permutations-ii/)

给定一个可包含重复数字的序列 `nums` ，**按任意顺序** 返回所有不重复的全排列。

```java
//先进行排序，在遍历的时候判断这个元素是否等于上一个元素，如果等于，并且前一个元素还没有访问，那么跳过这个元素，或者是访问了跳过当前元素，需要跳过一个
class Solution {
    public List<List<Integer>> permuteUnique(int[] nums) {
        //全排列
        List<List<Integer>> res = new ArrayList<>();
        //当前排列
        List<Integer> cur = new ArrayList<>();
        //标记是否已经访问过
        boolean[] hasVisited = new boolean[nums.length];
        //回溯
        Arrays.sort(nums);
        backTracking(cur, res, hasVisited, nums);
        return res;
    }

    private void backTracking(List<Integer> cur, List<List<Integer>> res, boolean[] hasVisited, int[] nums){
        //加入结果
        if(cur.size() == nums.length){
            //要新建，不然后面会被修改
            res.add(new ArrayList<>(cur));
        }
        //遍历可能的组合
        for(int i = 0; i < hasVisited.length; i++){
            if(i != 0 && nums[i] == nums[i-1] && !hasVisited[i-1]){
                continue;
            }
            //如果已经访问过的，通过
           if(hasVisited[i]){
               continue;
           }
           //加入答案，将访问标记置为true
           hasVisited[i] = true;
           cur.add(nums[i]); 
           //回溯剩下的部分
           backTracking(cur,res,hasVisited,nums);
           //移除之前回溯的状态
           cur.remove(cur.size()-1);
           hasVisited[i] = false;
        }
    }
}
```



### 3.10 [77. 组合](https://leetcode-cn.com/problems/combinations/)

给定两个整数 *n* 和 *k*，返回 1 ... *n* 中所有可能的 *k* 个数的组合。

```java
class Solution {
    public List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> res = new ArrayList<>();
        List<Integer> cur = new ArrayList<>();
        backTracking(cur, res, 1, k, n);
        return res;

    }

    private void backTracking(List<Integer> cur, List<List<Integer>> res, int start, int k, int n){
        //如果有k个数了
        if(k == 0){
            res.add(new ArrayList<>(cur));
            return;
        }
        //从起点开始遍历，因为有k个数那么作为起点，肯定不会大于n-k+1，可以用来剪枝
        for(int i = start; i <= n-k+1; i++){
            cur.add(i);
            //下次递归起点加一
            backTracking(cur, res, i+1, k-1, n);
            cur.remove(cur.size() - 1);
        }
    }
}
```



### 3.11 [78. 子集](https://leetcode-cn.com/problems/subsets/)

给定一组**不含重复元素**的整数数组 *nums*，返回该数组所有可能的子集（幂集）。

```java
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        List<Integer> cur = new ArrayList<>();
        //对应不同长度的子集
        for(int size = 0; size <= nums.length; size++){
            backTracking(0,size,nums,cur,res);
        }
        return res;
    }
	//start：状态变量，用来标识当前的选择列表的起始位置，控制选择列表
    private void backTracking(int start, int size, int[] nums, List<Integer> cur, List<List<Integer>> res){
        if(cur.size() == size){
            res.add(new ArrayList<>(cur));
            return;
        }
        for(int i = start; i < nums.length; i++){
            cur.add(nums[i]);
            backTracking(i+1,size,nums,cur,res);
            cur.remove(cur.size() - 1);
        }

    }
}
```

### 3.12 [90. 子集 II](https://leetcode-cn.com/problems/subsets-ii/)

给定一个可能包含重复元素的整数数组 ***nums***，返回该数组所有可能的子集（幂集）。

**说明：**解集不能包含重复的子集。

```java
class Solution {
    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        List<Integer> cur = new ArrayList<>();
        //对应不同长度的子集
        for(int size = 0; size <= nums.length; size++){
            backTracking(0,size,nums,cur,res);
        }
        return res;
    }
	//start：状态变量，用来标识当前的选择列表的起始位置，控制选择列表
    private void backTracking(int start, int size, int[] nums, List<Integer> cur, List<List<Integer>> res){
        if(cur.size() == size){
            res.add(new ArrayList<>(cur));
            return;
        }
        //从start到末尾，就是当前的选择列表
        for(int i = start; i < nums.length; i++){
            //去除当前选择列表中，与上一个数重复的数
            if(i>start && nums[i] == nums[i-1]){
                continue;
            }
            cur.add(nums[i]);
            backTracking(i+1,size,nums,cur,res);
            cur.remove(cur.size() - 1);
        }

    }
}
```

### 3.13 [491. 递增子序列](https://leetcode-cn.com/problems/increasing-subsequences/)

给定一个整型数组, 你的任务是找到所有该数组的递增子序列，递增子序列的长度至少是2。

```java
//注意与子集的区别
//这里只要本层重复使用元素，递增子序列就会重复：如{4，7，6，7}，如果重复使用，会有两个{4，7}
//子集问题是看排序后相邻的相同元素是否重复使用
class Solution {
    public List<List<Integer>> findSubsequences(int[] nums) {
        //答案
        List<List<Integer>> res = new ArrayList<>();
        //路径
        List<Integer> path = new ArrayList<>();
        backTracking(res, path, 0,  nums);
        return res;
    }
    private void backTracking(List<List<Integer>> res, List<Integer> path, int start,int[] nums){
        if(path.size() > 1){
            res.add(new ArrayList<>(path));
        }
        //只负责记录本层是否重复使用了，新的一层会清空
        boolean[] used = new boolean[201];
        for(int i = start; i < nums.length; i++){
            if((path.size() > 0 && nums[i] < path.get(path.size() - 1)) || used[nums[i]+100] == true   ){
                continue;
            }
            used[nums[i] + 100] = true;
            path.add(nums[i]);
            backTracking(res,path,i+1,nums);
            path.remove(path.size() - 1);
        }
    }
}
```

### 3.14 [51. N 皇后](https://leetcode-cn.com/problems/n-queens/)

*n* 皇后问题研究的是如何将 *n* 个皇后放置在 *n*×*n* 的棋盘上，并且使皇后彼此之间不能相互攻击。

二维矩阵中矩阵的高就是这颗树的高度，矩阵的宽就是树型结构中每一个节点的宽度。

**递归深度就是row控制棋盘的行，每一层里for循环的col控制棋盘的列，一行一列，确定了放置皇后的位置。**

**只要搜索到了树的叶子节点，说明就找到了皇后们的合理位置了**

```java
// 路径：board 中小于 row 的那些行都已经成功放置了皇后
// 选择列表：第 row 行的所有列都是放置皇后的选择
// 结束条件：row 超过 board 的最后一行
class Solution {
    List<List<String>> res = new ArrayList<>();
    public List<List<String>> solveNQueens(int n) {
        char[][] board = new char[n][n];
        for(char[] c:board){
            Arrays.fill(c,'.');
        }
        backTracking(board,0);
        return res;

    }

    private void backTracking(char[][] board, int row){
        if(row == board.length){
            res.add(arrayToList(board));
            return;
        }
        for(int col = 0; col < board.length; col++){
            if(!isValid(board,row,col)){
                continue;
            }
            board[row][col] = 'Q';
            backTracking(board,row+1);
            board[row][col] = '.';
        }

    }

    private List<String> arrayToList(char[][] board){
        List<String> temp = new ArrayList<>();
        for(char[] c : board){
            StringBuffer sb = new StringBuffer();
            for(char i : c){
                sb.append(i);
            }
            temp.add(sb.toString());
        }
        return temp;
    }
    
    //因为在每次递归的 for 循环中只会在同一行选一个，所有不用去重
    private boolean isValid(char[][] board, int row, int col){
        int n = board.length;
        //因为下面的还没有放置，只需要检查上面即可
        // 检查列是否有皇后互相冲突
        for (int i = 0; i < row; i++) {
            if (board[i][col] == 'Q')
                return false;
        }
        // 检查右上方是否有皇后互相冲突
        for (int i = row - 1, j = col + 1;
             i >= 0 && j < n; i--, j++) {
            if (board[i][j] == 'Q')
                return false;
        }
        // 检查左上方是否有皇后互相冲突
        for (int i = row - 1, j = col - 1;
             i >= 0 && j >= 0; i--, j--) {
            if (board[i][j] == 'Q')
                return false;
        }
        return true;
    }
}
```







### 3.15 时间复杂度

子集问题分析：

- 时间复杂度：O(n * 2^n)，因为每一个元素的状态无外乎取与不取，所以时间复杂度为O(2^n)，构造每一组子集都需要填进数组，又有需要O(n)，最终时间复杂度：O(n * 2^n)
- 空间复杂度：O(n)，递归深度为n，所以系统栈所用空间为O(n)，每一层递归所用的空间都是常数级别，注意代码里的result和path都是全局变量，就算是放在参数里，传的也是引用，并不会新申请内存空间，最终空间复杂度为O(n)

排列问题分析：

- 时间复杂度：O(n!)，这个可以从排列的树形图中很明显发现，每一层节点为n，第二层每一个分支都延伸了n-1个分支，再往下又是n-2个分支，所以一直到叶子节点一共就是 n * n-1 * n-2 * ..... 1 = n!。
- 空间复杂度：O(n)，和子集问题同理。

组合问题分析：

- 时间复杂度：O(n * 2^n)，组合问题其实就是一种子集的问题，所以组合问题最坏的情况，也不会超过子集问题的时间复杂度。
- 空间复杂度：O(n)，和子集问题同理。

N皇后问题分析：

- 时间复杂度：O(n!) ，其实如果看树形图的话，直觉上是O(n^n)，但皇后之间不能见面所以在搜索的过程中是有剪枝的，最差也就是O（n!），n!表示n * (n-1) * .... * 1。
- 空间复杂度：O(n)，和子集问题同理。

解数独问题分析：

- 时间复杂度：O(9^m) , m是'.'的数目。
- 空间复杂度：O(n^2)，递归的深度是n^2



































