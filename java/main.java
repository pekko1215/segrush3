public class main {
    public static void main(String[] args) {
        ReelInfo reelinfo = new ReelInfo();
        Boolean flag = reelinfo.loadFromFile("../data/Sample.dat");

        //System.out.println(flag);
        for (int i = 0; i < 21; i++) {
            System.out.print(reelinfo.getStopPos1st(17, 0, 0) + "->");
            System.out.print(reelinfo.getStopPos2nd(1, 0) + "->");
            System.out.println(reelinfo.getStopPos3rd(2, i));
        }
    }
}