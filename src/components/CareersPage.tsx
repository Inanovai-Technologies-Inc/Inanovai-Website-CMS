import Careers from './Careers'
import FinalCta from './FinalCta'

type CareersPageProps = {
  navigate: (to: string) => void
}

export default function CareersPage({ navigate }: CareersPageProps) {
  return (
    <>
      <Careers />
      <FinalCta navigate={navigate} />
    </>
  )
}
