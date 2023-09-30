import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Main from "@/components/Main";
import ProgressCircle from "@/components/assets/ProgressCircle";

export default function Page() {
  return (
    <>
      <Header />
      <Main>
        <ProgressCircle height={24} />
      </Main>
      <Footer />
    </>
  );
}
