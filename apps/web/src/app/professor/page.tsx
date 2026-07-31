import UploadForm from '@/components/UploadForm';

export default function ProfessorPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-8 font-sans text-gray-100 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="z-10 max-w-3xl w-full mt-12 mb-8 text-center">
        <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 drop-shadow-sm">
          Professor Portal
        </h1>
        <p className="text-lg text-gray-400">Upload course materials to generate the master knowledge base.</p>
      </div>

      <div className="z-10 max-w-xl w-full">
        <UploadForm />
      </div>
    </div>
  );
}
